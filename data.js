var APP_DATA = {
  "scenes": [
    {
      "id": "0-1---",
      "name": "1 этаж — копия",
"mapPosition": { "x": 30, "y": 45 },  // 👈 ДОБАВЬТЕ ЭТО
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        },
        {
          "tileSize": 512,
          "size": 2048
        }
      ],
      "faceSize": 2048,
      "initialViewParameters": {
        "pitch": 0,
        "yaw": 0,
        "fov": 1.5707963267948966
      },
      "linkHotspots": [
        {
          "yaw": 1.643616096794541,
          "pitch": 0.09688552449367371,
          "rotation": 0,
          "target": "1-2---"
        }
      ],
      "infoHotspots": [
        {
          "yaw": 0.9700259271394298,
          "pitch": 0.0415854690680213,
          "title": "тесмт",
          "text": "Text"
        }
      ]
    },
    {
      "id": "1-2---",
      "name": "2 этаж — копия",
"mapPosition": { "x": 55, "y": 40 },  // 👈 ДОБАВЬТЕ ЭТО
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        },
        {
          "tileSize": 512,
          "size": 2048
        }
      ],
      "faceSize": 2048,
      "initialViewParameters": {
        "pitch": 0,
        "yaw": 0,
        "fov": 1.5707963267948966
      },
      "linkHotspots": [
        {
          "yaw": 1.7833547368915976,
          "pitch": 0.07755493278573766,
          "rotation": 0,
          "target": "0-1---"
        },
        {
          "yaw": -1.6453405846612803,
          "pitch": -0.04600312280487806,
          "rotation": 0,
          "target": "2-4---"
        }
      ],
      "infoHotspots": [
        {
          "yaw": 0.9687710682121633,
          "pitch": 0.3196378992561044,
          "title": "тест 2<div><br></div>",
          "text": "Text"
        }
      ]
    },
    {
      "id": "2-4---",
      "name": "4 этаж — копия",
"mapPosition": { "x": 70, "y": 60 },  // 👈 ДОБАВЬТЕ ЭТО
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        },
        {
          "tileSize": 512,
          "size": 2048
        }
      ],
      "faceSize": 2048,
      "initialViewParameters": {
        "pitch": 0,
        "yaw": 0,
        "fov": 1.5707963267948966
      },
      "linkHotspots": [
        {
          "yaw": 1.760214127535762,
          "pitch": 0.017398990913982004,
          "rotation": 0,
          "target": "1-2---"
        }
      ],
      "infoHotspots": []
    },
    {
      "id": "3-5--1--",
      "name": "5 кабинет 1 — копия",
"mapPosition": { "x": 45, "y": 75 },  // 👈 ДОБАВЬТЕ ЭТО
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        },
        {
          "tileSize": 512,
          "size": 2048
        }
      ],
      "faceSize": 2048,
      "initialViewParameters": {
        "pitch": 0,
        "yaw": 0,
        "fov": 1.5707963267948966
      },
      "linkHotspots": [],
      "infoHotspots": []
    }
  ],
  "name": "тест карта",
  "settings": {
    "mouseViewMode": "drag",
    "autorotateEnabled": true,
    "fullscreenButton": true,
    "viewControlButtons": false
  }
};
