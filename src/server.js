import 'dotenv/config';
import app from './app.js';
import { connectToDB } from './db/connect.js';

const { PORT = 4000 } = process.env;

connectToDB()
  .then((connection) => {
    console.log('Conectado a MongoDB:', connection.name);
    app.listen(PORT, () => console.log(`Servidor ejecutandose en el puerto ${PORT}`));
  })
  .catch((err) => {
    console.error('Error conectando a MongoDB:', err);
    process.exit(1);
  });
