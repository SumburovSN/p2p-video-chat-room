import express from 'express';

const app = express();
const PORT = 9100;

app.use(express.json());

// Первый участник, ожидающий пару
let waitingPeer = null;

// Результаты подбора пары для первых участников
const matches = new Map();

// Проверка состояния Room Manager
app.get('/api/room/status', (req, res) => {
  res.json({
    waiting: waitingPeer !== null,
  });
});

// Участник присоединяется к поиску пары
app.post('/api/room/join', (req, res) => {
  const { peerId } = req.body;

  if (!peerId) {
    return res.status(400).json({
      error: 'peerId is required',
    });
  }

  console.log('👤 Новый участник:', peerId);

  // Если никто не ожидает — сохраняем участника
  if (!waitingPeer) {
    waitingPeer = peerId;

    console.log('⏳ Участник ожидает:', peerId);

    return res.json({
      role: 'waiting',
    });
  }

  // Не соединяем участника с самим собой
  if (waitingPeer === peerId) {
    return res.json({
      role: 'waiting',
    });
  }

  // Нашли пару
  const firstPeer = waitingPeer;
  const secondPeer = peerId;

  waitingPeer = null;

  // Сохраняем ID второго участника для первого
  matches.set(firstPeer, secondPeer);

  console.log('🤝 Найдена пара:');
  console.log('   первый:', firstPeer);
  console.log('   второй:', secondPeer);

  // Второй сразу получает ID первого
  return res.json({
    role: 'connected',
    friendId: firstPeer,
  });
});


// Участник покидает поиск/комнату
app.post('/api/room/leave', (req, res) => {
  const { peerId } = req.body;

  if (!peerId) {
    return res.status(400).json({
      error: 'peerId is required',
    });
  }

  console.log('🚪 Участник покидает комнату:', peerId);

  // Если участник просто ждал пару
  if (waitingPeer === peerId) {
    waitingPeer = null;

    console.log('🧹 Ожидающий участник удалён:', peerId);

    return res.json({
      success: true,
      removed: 'waiting',
    });
  }

  // Если для участника ещё хранится найденная пара
  if (matches.has(peerId)) {
    matches.delete(peerId);

    console.log('🧹 Ожидающая пара удалена:', peerId);

    return res.json({
      success: true,
      removed: 'match',
    });
  }

  // Проверяем, не является ли этот участник вторым участником пары
  for (const [firstPeer, secondPeer] of matches.entries()) {
    if (secondPeer === peerId) {
      matches.delete(firstPeer);

      console.log(
        '🧹 Пара удалена:',
        firstPeer,
        '<->',
        secondPeer
      );

      return res.json({
        success: true,
        removed: 'match',
      });
    }
  }

  // Участник уже отсутствует — это не ошибка
  return res.json({
    success: true,
    removed: false,
  });
});


// Первый участник проверяет, нашлась ли пара
app.get('/api/room/wait', (req, res) => {
  const { peerId } = req.query;

  if (!peerId) {
    return res.status(400).json({
      error: 'peerId is required',
    });
  }

  // Проверяем, появилась ли пара для этого участника
  const friendId = matches.get(peerId);

  if (friendId) {
    // Результат получен — удаляем его из памяти
    matches.delete(peerId);

    console.log('📬 Участник получил пару:', peerId, '->', friendId);

    return res.json({
      role: 'connected',
      friendId,
    });
  }

  // Пара пока не найдена
  return res.json({
    role: 'waiting',
  });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(
    `🏠 Room Manager запущен на http://127.0.0.1:${PORT}`
  );
});
