/*
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

(function() {
  var Marzipano = window.Marzipano;
  var bowser = window.bowser;
  var screenfull = window.screenfull;
  var data = window.APP_DATA;

  // Grab elements from DOM.
  var panoElement = document.querySelector('#pano');
  var sceneNameElement = document.querySelector('#titleBar .sceneName');
  var sceneListElement = document.querySelector('#sceneList');
  var sceneElements = document.querySelectorAll('#sceneList .scene');
  var sceneListToggleElement = document.querySelector('#sceneListToggle');
  var autorotateToggleElement = document.querySelector('#autorotateToggle');
  var fullscreenToggleElement = document.querySelector('#fullscreenToggle');

  // Detect desktop or mobile mode.
  if (window.matchMedia) {
    var setMode = function() {
      if (mql.matches) {
        document.body.classList.remove('desktop');
        document.body.classList.add('mobile');
      } else {
        document.body.classList.remove('mobile');
        document.body.classList.add('desktop');
      }
    };
    var mql = matchMedia("(max-width: 500px), (max-height: 500px)");
    setMode();
    mql.addListener(setMode);
  } else {
    document.body.classList.add('desktop');
  }

  // Detect whether we are on a touch device.
  document.body.classList.add('no-touch');
  window.addEventListener('touchstart', function() {
    document.body.classList.remove('no-touch');
    document.body.classList.add('touch');
  });

  // Use tooltip fallback mode on IE < 11.
  if (bowser.msie && parseFloat(bowser.version) < 11) {
    document.body.classList.add('tooltip-fallback');
  }

  // Viewer options.
  var viewerOpts = {
    controls: {
      mouseViewMode: data.settings.mouseViewMode
    }
  };

  // Initialize viewer.
  var viewer = new Marzipano.Viewer(panoElement, viewerOpts);

  // Create scenes.
  var scenes = data.scenes.map(function(data) {
    var urlPrefix = "tiles";
    var source = Marzipano.ImageUrlSource.fromString(
      urlPrefix + "/" + data.id + "/{z}/{f}/{y}/{x}.jpg",
      { cubeMapPreviewUrl: urlPrefix + "/" + data.id + "/preview.jpg" });
    var geometry = new Marzipano.CubeGeometry(data.levels);

    var limiter = Marzipano.RectilinearView.limit.traditional(data.faceSize, 100*Math.PI/180, 120*Math.PI/180);
    var view = new Marzipano.RectilinearView(data.initialViewParameters, limiter);

    var scene = viewer.createScene({
      source: source,
      geometry: geometry,
      view: view,
      pinFirstLevel: true
    });

    // Create link hotspots.
    data.linkHotspots.forEach(function(hotspot) {
      var element = createLinkHotspotElement(hotspot);
      scene.hotspotContainer().createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
    });

    // Create info hotspots.
    data.infoHotspots.forEach(function(hotspot) {
      var element = createInfoHotspotElement(hotspot);
      scene.hotspotContainer().createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
    });

    return {
      data: data,
      scene: scene,
      view: view
    };
  });

  // Set up autorotate, if enabled.
  var autorotate = Marzipano.autorotate({
    yawSpeed: 0.03,
    targetPitch: 0,
    targetFov: Math.PI/2
  });
  if (data.settings.autorotateEnabled) {
    autorotateToggleElement.classList.add('enabled');
  }

  // Set handler for autorotate toggle.
  autorotateToggleElement.addEventListener('click', toggleAutorotate);

  // Set up fullscreen mode, if supported.
  if (screenfull.enabled && data.settings.fullscreenButton) {
    document.body.classList.add('fullscreen-enabled');
    fullscreenToggleElement.addEventListener('click', function() {
      screenfull.toggle();
    });
    screenfull.on('change', function() {
      if (screenfull.isFullscreen) {
        fullscreenToggleElement.classList.add('enabled');
      } else {
        fullscreenToggleElement.classList.remove('enabled');
      }
    });
  } else {
    document.body.classList.add('fullscreen-disabled');
  }

  // Set handler for scene list toggle.
  sceneListToggleElement.addEventListener('click', toggleSceneList);

  // Start with the scene list open on desktop.
  if (!document.body.classList.contains('mobile')) {
    showSceneList();
  }

  // Set handler for scene switch.
  scenes.forEach(function(scene) {
    var el = document.querySelector('#sceneList .scene[data-id="' + scene.data.id + '"]');
    el.addEventListener('click', function() {
      switchScene(scene);
      // On mobile, hide scene list after selecting a scene.
      if (document.body.classList.contains('mobile')) {
        hideSceneList();
      }
    });
  });

  // DOM elements for view controls.
  var viewUpElement = document.querySelector('#viewUp');
  var viewDownElement = document.querySelector('#viewDown');
  var viewLeftElement = document.querySelector('#viewLeft');
  var viewRightElement = document.querySelector('#viewRight');
  var viewInElement = document.querySelector('#viewIn');
  var viewOutElement = document.querySelector('#viewOut');

  // Dynamic parameters for controls.
  var velocity = 0.7;
  var friction = 3;

  // Associate view controls with elements.
  var controls = viewer.controls();
  controls.registerMethod('upElement',    new Marzipano.ElementPressControlMethod(viewUpElement,     'y', -velocity, friction), true);
  controls.registerMethod('downElement',  new Marzipano.ElementPressControlMethod(viewDownElement,   'y',  velocity, friction), true);
  controls.registerMethod('leftElement',  new Marzipano.ElementPressControlMethod(viewLeftElement,   'x', -velocity, friction), true);
  controls.registerMethod('rightElement', new Marzipano.ElementPressControlMethod(viewRightElement,  'x',  velocity, friction), true);
  controls.registerMethod('inElement',    new Marzipano.ElementPressControlMethod(viewInElement,  'zoom', -velocity, friction), true);
  controls.registerMethod('outElement',   new Marzipano.ElementPressControlMethod(viewOutElement, 'zoom',  velocity, friction), true);

  function sanitize(s) {
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;');
  }

  function switchScene(scene) {
    stopAutorotate();
    scene.view.setParameters(scene.data.initialViewParameters);
    scene.scene.switchTo();
    startAutorotate();
    updateSceneName(scene);
    updateSceneList(scene);
  }

  function updateSceneName(scene) {
    sceneNameElement.innerHTML = sanitize(scene.data.name);
  }

  function updateSceneList(scene) {
    for (var i = 0; i < sceneElements.length; i++) {
      var el = sceneElements[i];
      if (el.getAttribute('data-id') === scene.data.id) {
        el.classList.add('current');
      } else {
        el.classList.remove('current');
      }
    }
  }

  function showSceneList() {
    sceneListElement.classList.add('enabled');
    sceneListToggleElement.classList.add('enabled');
  }

  function hideSceneList() {
    sceneListElement.classList.remove('enabled');
    sceneListToggleElement.classList.remove('enabled');
  }

  function toggleSceneList() {
    sceneListElement.classList.toggle('enabled');
    sceneListToggleElement.classList.toggle('enabled');
  }

  function startAutorotate() {
    if (!autorotateToggleElement.classList.contains('enabled')) {
      return;
    }
    viewer.startMovement(autorotate);
    viewer.setIdleMovement(3000, autorotate);
  }

  function stopAutorotate() {
    viewer.stopMovement();
    viewer.setIdleMovement(Infinity);
  }

  function toggleAutorotate() {
    if (autorotateToggleElement.classList.contains('enabled')) {
      autorotateToggleElement.classList.remove('enabled');
      stopAutorotate();
    } else {
      autorotateToggleElement.classList.add('enabled');
      startAutorotate();
    }
  }

  function createLinkHotspotElement(hotspot) {

    // Create wrapper element to hold icon and tooltip.
    var wrapper = document.createElement('div');
    wrapper.classList.add('hotspot');
    wrapper.classList.add('link-hotspot');

    // Create image element.
    var icon = document.createElement('img');
    icon.src = 'img/link.png';
    icon.classList.add('link-hotspot-icon');

    // Set rotation transform.
    var transformProperties = [ '-ms-transform', '-webkit-transform', 'transform' ];
    for (var i = 0; i < transformProperties.length; i++) {
      var property = transformProperties[i];
      icon.style[property] = 'rotate(' + hotspot.rotation + 'rad)';
    }

    // Add click event handler.
    wrapper.addEventListener('click', function() {
      switchScene(findSceneById(hotspot.target));
    });

    // Prevent touch and scroll events from reaching the parent element.
    // This prevents the view control logic from interfering with the hotspot.
    stopTouchAndScrollEventPropagation(wrapper);

    // Create tooltip element.
    var tooltip = document.createElement('div');
    tooltip.classList.add('hotspot-tooltip');
    tooltip.classList.add('link-hotspot-tooltip');
    tooltip.innerHTML = findSceneDataById(hotspot.target).name;

    wrapper.appendChild(icon);
    wrapper.appendChild(tooltip);

    return wrapper;
  }

  function createInfoHotspotElement(hotspot) {

    // Create wrapper element to hold icon and tooltip.
    var wrapper = document.createElement('div');
    wrapper.classList.add('hotspot');
    wrapper.classList.add('info-hotspot');

    // Create hotspot/tooltip header.
    var header = document.createElement('div');
    header.classList.add('info-hotspot-header');

    // Create image element.
    var iconWrapper = document.createElement('div');
    iconWrapper.classList.add('info-hotspot-icon-wrapper');
    var icon = document.createElement('img');
    icon.src = 'img/info.png';
    icon.classList.add('info-hotspot-icon');
    iconWrapper.appendChild(icon);

    // Create title element.
    var titleWrapper = document.createElement('div');
    titleWrapper.classList.add('info-hotspot-title-wrapper');
    var title = document.createElement('div');
    title.classList.add('info-hotspot-title');
    title.innerHTML = hotspot.title;
    titleWrapper.appendChild(title);

    // Create close element.
    var closeWrapper = document.createElement('div');
    closeWrapper.classList.add('info-hotspot-close-wrapper');
    var closeIcon = document.createElement('img');
    closeIcon.src = 'img/close.png';
    closeIcon.classList.add('info-hotspot-close-icon');
    closeWrapper.appendChild(closeIcon);

    // Construct header element.
    header.appendChild(iconWrapper);
    header.appendChild(titleWrapper);
    header.appendChild(closeWrapper);

    // Create text element.
    var text = document.createElement('div');
    text.classList.add('info-hotspot-text');
    text.innerHTML = hotspot.text;

    // Place header and text into wrapper element.
    wrapper.appendChild(header);
    wrapper.appendChild(text);

    // Create a modal for the hotspot content to appear on mobile mode.
    var modal = document.createElement('div');
    modal.innerHTML = wrapper.innerHTML;
    modal.classList.add('info-hotspot-modal');
    document.body.appendChild(modal);

    var toggle = function() {
      wrapper.classList.toggle('visible');
      modal.classList.toggle('visible');
    };

    // Show content when hotspot is clicked.
    wrapper.querySelector('.info-hotspot-header').addEventListener('click', toggle);

    // Hide content when close icon is clicked.
    modal.querySelector('.info-hotspot-close-wrapper').addEventListener('click', toggle);

    // Prevent touch and scroll events from reaching the parent element.
    // This prevents the view control logic from interfering with the hotspot.
    stopTouchAndScrollEventPropagation(wrapper);

    return wrapper;
  }

  // Prevent touch and scroll events from reaching the parent element.
  function stopTouchAndScrollEventPropagation(element, eventList) {
    var eventList = [ 'touchstart', 'touchmove', 'touchend', 'touchcancel',
                      'wheel', 'mousewheel' ];
    for (var i = 0; i < eventList.length; i++) {
      element.addEventListener(eventList[i], function(event) {
        event.stopPropagation();
      });
    }
  }

  function findSceneById(id) {
    for (var i = 0; i < scenes.length; i++) {
      if (scenes[i].data.id === id) {
        return scenes[i];
      }
    }
    return null;
  }

  function findSceneDataById(id) {
    for (var i = 0; i < data.scenes.length; i++) {
      if (data.scenes[i].id === id) {
        return data.scenes[i];
      }
    }
    return null;
  }

  // Display the initial scene.
  switchScene(scenes[0]);

})();
// ============================================
// МИНИ-КАРТА (ФИНАЛЬНАЯ СТАБИЛЬНАЯ ВЕРСИЯ)
// ============================================

(function() {
  'use strict';

  // Элементы
  var mapBtn = document.getElementById('mini-map-btn');
  var mapContainer = document.getElementById('mini-map-container');
  var mapImage = document.getElementById('mini-map-image');
  var pointsContainer = document.getElementById('map-points-container');
  var zoomInBtn = document.getElementById('map-zoom-in');
  var zoomOutBtn = document.getElementById('map-zoom-out');

  // Создаём обёртку для содержимого (только 1 раз)
  if (!document.getElementById('map-wrapper')) {
    var wrapper = document.createElement('div');
    wrapper.id = 'map-wrapper';
    wrapper.style.cssText = 'position:relative;width:100%;height:100%;overflow:hidden;';
    
    var content = document.createElement('div');
    content.id = 'map-content';
    content.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;transform-origin:center center;';
    
    // Перемещаем картинку и контейнер точек в content
    mapContainer.insertBefore(wrapper, mapImage);
    wrapper.appendChild(content);
    content.appendChild(mapImage);
    content.appendChild(pointsContainer);
  }

  // Получаем ссылки на созданные элементы
  var content = document.getElementById('map-content');

  // Индикатор зума
  var zoomIndicator = document.getElementById('zoom-indicator');
  if (!zoomIndicator) {
    zoomIndicator = document.createElement('div');
    zoomIndicator.id = 'zoom-indicator';
    zoomIndicator.textContent = '100%';
    mapContainer.appendChild(zoomIndicator);
  }

  var isMapOpen = false;
  var zoomLevel = 1;
  var maxZoom = 3;
  var minZoom = 1;
  var zoomStep = 0.1;

  // КЭШ ДЛЯ ТОЧЕК - сохраняем один раз и переиспользуем
  var cachedPoints = null;
  var cachedSceneId = null;

  // ===== ОТКРЫТИЕ/ЗАКРЫТИЕ =====
  mapBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    toggleMap();
  });

  function toggleMap() {
    isMapOpen = !isMapOpen;
    mapContainer.classList.toggle('open', isMapOpen);
    if (isMapOpen) {
      // ОТРИСОВЫВАЕМ ТОЧКИ ТОЛЬКО ЕСЛИ ИЗМЕНИЛАСЬ СЦЕНА ИЛИ ПЕРВЫЙ РАЗ
      var currentId = getCurrentSceneId();
      if (cachedSceneId !== currentId || cachedPoints === null) {
        updateMapPoints();
        cachedSceneId = currentId;
      } else {
        // Просто показываем уже существующие точки
        showExistingPoints();
      }
      resetZoom();
      updateZoomIndicator();
    }
  }

  // Закрытие по клику вне карты
  document.addEventListener('click', function(e) {
    if (isMapOpen && 
        !mapContainer.contains(e.target) && 
        e.target !== mapBtn &&
        !mapBtn.contains(e.target)) {
      mapContainer.classList.remove('open');
      isMapOpen = false;
    }
  });

  // ===== ПОКАЗАТЬ СУЩЕСТВУЮЩИЕ ТОЧКИ =====
  function showExistingPoints() {
    var points = pointsContainer.querySelectorAll('.map-point');
    var currentId = getCurrentSceneId();
    
    points.forEach(function(point) {
      // Обновляем активный класс
      point.classList.remove('active');
      if (point.dataset.sceneId === currentId) {
        point.classList.add('active');
      }
      // Делаем видимыми
      point.style.opacity = '1';
      point.style.animation = 'none';
    });
  }

  // ===== ОТРИСОВКА ТОЧЕК (с кэшированием) =====
  function updateMapPoints() {
    var scenes = window.APP_DATA.scenes;
    var currentSceneId = getCurrentSceneId();

    // СОХРАНЯЕМ В КЭШ
    cachedPoints = [];
    cachedSceneId = currentSceneId;

    // Очищаем контейнер
    pointsContainer.innerHTML = '';

    scenes.forEach(function(sceneData, index) {
      if (!sceneData.mapPosition) return;

      var point = document.createElement('div');
      point.className = 'map-point';
      point.dataset.sceneId = sceneData.id;
      point.dataset.index = index;
      
      // Активная точка
      if (sceneData.id === currentSceneId) {
        point.classList.add('active');
      }

      // Позиция в ПРОЦЕНТАХ
      point.style.left = sceneData.mapPosition.x + '%';
      point.style.top = sceneData.mapPosition.y + '%';

      // Сохраняем координаты
      point.dataset.x = sceneData.mapPosition.x;
      point.dataset.y = sceneData.mapPosition.y;

      // Подпись
      var label = document.createElement('span');
      label.className = 'point-label';
      label.textContent = sceneData.name;
      point.appendChild(label);

      // Переход по клику
      point.addEventListener('click', function(e) {
        e.stopPropagation();
        switchToScene(sceneData.id);
        // Обновляем активную точку без перерисовки всех
        updateActivePoint(sceneData.id);
        // Закрываем карту после перехода (опционально)
        // mapContainer.classList.remove('open');
        // isMapOpen = false;
      });

      // Задержка для анимации (только при первом создании)
      point.style.animationDelay = (0.1 + index * 0.08) + 's';
      
      pointsContainer.appendChild(point);
      
      // Сохраняем в кэш
      cachedPoints.push({
        id: sceneData.id,
        element: point
      });
    });
  }

  // ===== ОБНОВЛЕНИЕ АКТИВНОЙ ТОЧКИ =====
  function updateActivePoint(activeId) {
    var points = pointsContainer.querySelectorAll('.map-point');
    points.forEach(function(point) {
      point.classList.remove('active');
      if (point.dataset.sceneId === activeId) {
        point.classList.add('active');
      }
    });
    cachedSceneId = activeId;
  }

  // ===== МАСШТАБИРОВАНИЕ =====
  function setZoom(level) {
    zoomLevel = Math.min(Math.max(level, minZoom), maxZoom);
    content.style.transform = 'scale(' + zoomLevel + ')';
    updateZoomIndicator();
  }

  function updateZoomIndicator() {
    var percent = Math.round(zoomLevel * 100);
    zoomIndicator.textContent = percent + '%';
  }

  function resetZoom() {
    zoomLevel = 1;
    content.style.transform = 'scale(1)';
    updateZoomIndicator();
  }

  // ===== ОБРАБОТЧИКИ ЗУМА =====
  zoomInBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    setZoom(zoomLevel + zoomStep);
  });

  zoomOutBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    setZoom(zoomLevel - zoomStep);
  });

  // Колесико мыши
  mapContainer.addEventListener('wheel', function(e) {
    if (!isMapOpen) return;
    e.preventDefault();
    e.stopPropagation();
    
    var delta = e.deltaY > 0 ? -zoomStep : zoomStep;
    setZoom(zoomLevel + delta);
  }, { passive: false });

  // Двойной клик - сброс
  mapContainer.addEventListener('dblclick', function(e) {
    e.stopPropagation();
    resetZoom();
  });

  // ===== ПОЛУЧИТЬ ТЕКУЩУЮ СЦЕНУ =====
  function getCurrentSceneId() {
    var currentEl = document.querySelector('#sceneList .scene.current');
    if (currentEl) {
      return currentEl.getAttribute('data-id');
    }
    var firstScene = document.querySelector('#sceneList .scene');
    return firstScene ? firstScene.getAttribute('data-id') : null;
  }

  // ===== ПЕРЕКЛЮЧЕНИЕ СЦЕНЫ =====
  function switchToScene(sceneId) {
    var sceneLink = document.querySelector('#sceneList .scene[data-id="' + sceneId + '"]');
    if (sceneLink) {
      sceneLink.click();
    }
  }

  // ===== НАБЛЮДАТЕЛЬ ЗА СМЕНОЙ СЦЕНЫ =====
  var observer = new MutationObserver(function() {
    var newId = getCurrentSceneId();
    if (newId !== cachedSceneId) {
      // Сцена изменилась - обновляем активную точку
      if (isMapOpen) {
        updateActivePoint(newId);
        cachedSceneId = newId;
      } else {
        // Если карта закрыта, просто запоминаем новую сцену
        cachedSceneId = newId;
      }
    }
  });

  var sceneList = document.getElementById('sceneList');
  if (sceneList) {
    observer.observe(sceneList, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['class']
    });
  }

  // ===== ПЕРВИЧНАЯ ИНИЦИАЛИЗАЦИЯ =====
  setTimeout(function() {
    var currentId = getCurrentSceneId();
    cachedSceneId = currentId;
    updateMapPoints();
    resetZoom();
    console.log('🗺️ Мини-карта инициализирована (стабильная версия)');
    console.log('✓ Точки кэшируются и НЕ пересоздаются при каждом открытии');
    console.log('✓ Активная точка обновляется без перерисовки всех точек');
  }, 100);

})();