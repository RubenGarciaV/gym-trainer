import './env.js';
import app from './app.js';

const port = Number(process.env.PORT ?? 3001);

app.listen(port, () => {
  console.log(`Gym Trainer API listening on port ${port}`);
});
