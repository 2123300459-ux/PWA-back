import mongoose from "mongoose";

let cached = global._mongooseConn;
if (!cached) cached = global._mongooseConn = { conn: null, promise: null };

export async function connectToDB(){
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const { MONGO_URI, MONGO_DB_NAME = "BackPWA" } = process.env;
    if (!MONGO_URI) throw new Error('Define la variable de entorno MONGO_URI');
    cached.promise = mongoose.connect(MONGO_URI, { dbName: MONGO_DB_NAME })
      .then((m) => m.connection);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
