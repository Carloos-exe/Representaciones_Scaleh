const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: 'https://adjusted-chicken-46347.upstash.io',
  token: '********',
});

async function interactuarConRedis() {
  try {
    await redis.set('foo', 'bar');
    console.log('Valor guardado en Redis');

    const data = await redis.get('foo');
    console.log('Valor recuperado de Redis:', data);
  } catch (error) {
    console.error('Error al interactuar con Redis:', error);
  }
}

interactuarConRedis();
