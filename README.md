Сервер осуществляет обмен между двумя браузерами для установления PeerJS связи.
```
Браузер 1
   │
   │ PeerJS ID
   ▼
Room Manager
   ▲
   │ PeerJS ID
   │
Браузер 2
   │
   └── получает friendId
           │
           ▼
       PeerJS call
           │
           ▼
        WebRTC
           │
           ▼
         TURN
```
Создан для работы приложения https://github.com/SumburovSN/p2p-video-chat