import app from '../src/app.js';
import { connectToDB } from '../src/db/connect.js';

export default async function handler(req, res) {
  await connectToDB();
  return app(req, res);
}
