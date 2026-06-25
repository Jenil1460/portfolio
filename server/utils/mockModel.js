const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'data', 'db.json');

// Ensure database directory and file exist
if (!fs.existsSync(path.dirname(DB_FILE))) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
}
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ admins: [], categories: [], videos: [], settings: [] }, null, 2), 'utf8');
}

const readData = () => {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (err) {
    console.error('Error reading local JSON db file:', err.message);
    return { admins: [], categories: [], videos: [], settings: [] };
  }
};

const writeData = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing local JSON db file:', err.message);
  }
};

const matchQuery = (item, query) => {
  if (!query) return true;
  if (Object.keys(query).length === 0) return true;

  for (let key in query) {
    const val = query[key];

    // Handle $or query blocks
    if (key === '$or') {
      const conditions = val;
      const match = conditions.some(cond => {
        const field = Object.keys(cond)[0];
        const condVal = cond[field];
        if (condVal && condVal.$regex) {
          const regex = new RegExp(condVal.$regex, condVal.$options || '');
          return regex.test(item[field] || '');
        }
        return item[field] == condVal; // loose match to allow ObjectId vs string checks
      });
      if (!match) return false;
      continue;
    }

    // Handle $ne query blocks
    if (val && val.$ne) {
      if (item[key] == val.$ne) return false;
      continue;
    }

    // Standard matching
    if (item[key] != val) return false;
  }
  return true;
};

class DocumentWrapper {
  constructor(data, collection) {
    Object.assign(this, data);
    this._collection = collection;
  }

  async save() {
    const db = readData();
    const items = db[this._collection];
    const idx = items.findIndex(item => item._id === this._id);

    const rawData = { ...this };
    delete rawData._collection;

    if (idx !== -1) {
      items[idx] = { ...items[idx], ...rawData, updatedAt: new Date().toISOString() };
    } else {
      rawData._id = rawData._id || Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      rawData.createdAt = rawData.createdAt || new Date().toISOString();
      rawData.updatedAt = new Date().toISOString();
      items.push(rawData);
    }
    db[this._collection] = items;
    writeData(db);
    return this;
  }

  async deleteOne() {
    const db = readData();
    db[this._collection] = db[this._collection].filter(item => item._id !== this._id);
    writeData(db);
    return { deletedCount: 1 };
  }

  async matchPassword(enteredPassword) {
    const bcrypt = require('bcryptjs');
    const isBcryptHash = this.password && (this.password.startsWith('$2a$') || this.password.startsWith('$2b$'));
    if (!isBcryptHash) {
      return enteredPassword === this.password;
    }
    try {
      return await bcrypt.compare(enteredPassword, this.password);
    } catch (err) {
      return false;
    }
  }

  populate(pathName) {
    if (pathName.startsWith('category')) {
      const db = readData();
      if (this.category && typeof this.category === 'string') {
        const cat = db.categories.find(c => c._id === this.category);
        this.category = cat ? new DocumentWrapper(cat, 'categories') : null;
      }
    }
    return this;
  }
}

class MockQuery {
  constructor(data, collection) {
    this.data = data || [];
    this.collection = collection;
  }

  populate(pathName) {
    this.data = this.data.map(item => {
      const doc = new DocumentWrapper(item, this.collection);
      doc.populate(pathName);
      return doc;
    });
    return this;
  }

  sort(options) {
    const keys = Object.keys(options);
    this.data.sort((a, b) => {
      for (let key of keys) {
        const order = options[key];
        const valA = a[key] !== undefined ? a[key] : '';
        const valB = b[key] !== undefined ? b[key] : '';
        if (valA < valB) return order === 1 ? -1 : 1;
        if (valA > valB) return order === 1 ? 1 : -1;
      }
      return 0;
    });
    return this;
  }

  skip(num) {
    this.data = this.data.slice(num);
    return this;
  }

  limit(num) {
    this.data = this.data.slice(0, num);
    return this;
  }

  then(onResolve, onReject) {
    const wrapped = this.data.map(item => new DocumentWrapper(item, this.collection));
    return Promise.resolve(wrapped).then(onResolve, onReject);
  }
}

class MockQuerySingle {
  constructor(data, collection) {
    this.data = data;
    this.collection = collection;
  }

  populate(pathName) {
    if (this.data) {
      const doc = new DocumentWrapper(this.data, this.collection);
      doc.populate(pathName);
      this.data = doc;
    }
    return this;
  }

  select(fields) {
    return this;
  }

  then(onResolve, onReject) {
    const wrapped = this.data ? new DocumentWrapper(this.data, this.collection) : null;
    return Promise.resolve(wrapped).then(onResolve, onReject);
  }
}

const mockModelCreator = (collectionName, schema) => {
  return class Model {
    static find(query) {
      const db = readData();
      const items = db[collectionName] || [];
      const filtered = items.filter(item => matchQuery(item, query));
      return new MockQuery(filtered.map(item => ({ ...item })), collectionName);
    }

    static findOne(query) {
      const db = readData();
      const items = db[collectionName] || [];
      const found = items.find(item => matchQuery(item, query));
      return new MockQuerySingle(found ? { ...found } : null, collectionName);
    }

    static findById(id) {
      const db = readData();
      const items = db[collectionName] || [];
      const found = items.find(item => item._id === id);
      return new MockQuerySingle(found ? { ...found } : null, collectionName);
    }

    static async create(data) {
      const db = readData();
      
      // Extract schema defaults
      const defaults = {};
      if (schema) {
        schema.eachPath((pathName, schemaType) => {
          if (schemaType.defaultValue !== undefined) {
            if (typeof schemaType.defaultValue === 'function') {
              if (schemaType.defaultValue.name !== 'now') {
                try {
                  defaults[pathName] = schemaType.defaultValue();
                } catch (e) {}
              }
            } else {
              // Deep clone array/object defaults
              defaults[pathName] = JSON.parse(JSON.stringify(schemaType.defaultValue));
            }
          }
        });
      }

      const newItem = {
        _id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...defaults,
        ...data,
      };

      if (collectionName === 'categories' && newItem.name && !newItem.slug) {
        newItem.slug = newItem.name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
      }

      db[collectionName] = db[collectionName] || [];
      db[collectionName].push(newItem);
      writeData(db);
      return new DocumentWrapper(newItem, collectionName);
    }

    static async countDocuments(query) {
      const db = readData();
      const items = db[collectionName] || [];
      const filtered = items.filter(item => matchQuery(item, query));
      return filtered.length;
    }

    static findByIdAndUpdate(id, update, options) {
      const db = readData();
      const items = db[collectionName] || [];
      const idx = items.findIndex(item => item._id === id);
      if (idx === -1) {
        return new MockQuerySingle(null, collectionName);
      }

      if (update.$inc) {
        const keys = Object.keys(update.$inc);
        for (let k of keys) {
          items[idx][k] = (items[idx][k] || 0) + update.$inc[k];
        }
      } else {
        items[idx] = { ...items[idx], ...update, updatedAt: new Date().toISOString() };
      }

      db[collectionName] = items;
      writeData(db);
      return new MockQuerySingle(items[idx], collectionName);
    }
  };
};

module.exports = mockModelCreator;
