// ===== Sistema de identidad digital para obras de arte =====
// QR -> Short URL -> app web genérica -> metadata.json en GitHub

(function () {
  'use strict';

  // Elementos del DOM
  var elArtwork = document.getElementById('artwork');
  var elImage = document.getElementById('artwork-image');
  var elTitle = document.getElementById('artwork-title');
  var elMeta = document.getElementById('artwork-meta');
  var elDetail = document.getElementById('artwork-detail');
  var elStatus = document.getElementById('artwork-status');
  var elLoading = document.getElementById('loading');
  var elNotFound = document.getElementById('not-found');

  // Estados conocidos y su presentación
  var ESTADOS = {
    created: 'creada',
    exhibited: 'en exhibición',
    sold: 'vendida',
    transferred: 'transferida',
    archived: 'archivada'
  };

  // Extraer artwork_id desde el hash: #/art/INTERCAMBIOS -> INTERCAMBIOS
  function obtenerArtworkId() {
    var hash = window.location.hash || '';
    // quitar '#' inicial
    hash = hash.replace(/^#\/?/, '');
    // dividir por '/'
    var partes = hash.split('/').filter(function (p) { return p.length > 0; });
    // el último segmento no vacío es el id (permite /art/INTERCAMBIOS o /INTERCAMBIOS)
    if (partes.length === 0) return null;
    return partes[partes.length - 1].toUpperCase();
  }

  // Construir ruta relativa a metadata.json
  function rutaMetadata(id) {
    return 'artworks/' + id + '/metadata.json';
  }

  // Renderizar la ficha de la obra
  function renderizar(meta) {
    // Título
    elTitle.textContent = meta.title || meta.artwork_id || 'Obra';

    // Imagen
    if (meta.image) {
      elImage.src = 'artworks/' + meta.artwork_id + '/' + meta.image;
      elImage.alt = meta.title || meta.artwork_id || '';
    } else {
      elImage.style.display = 'none';
    }

    // Línea de metadatos primarios (artista · año · edición)
    var partesMeta = [];
    if (meta.artist) partesMeta.push(meta.artist);
    if (meta.year) partesMeta.push(String(meta.year));
    if (meta.edition) partesMeta.push('edición ' + meta.edition);
    elMeta.textContent = partesMeta.join(' · ');

    // Detalles secundarios opcionales
    var detalles = [];
    var campos = [
      ['series', 'Serie'],
      ['technique', 'Técnica'],
      ['dimensions', 'Dimensiones'],
      ['description', 'Descripción'],
      ['location', 'Ubicación'],
      ['owner', 'Propietario']
    ];
    campos.forEach(function (c) {
      if (meta[c[0]]) {
        detalles.push({ label: c[1], value: meta[c[0]] });
      }
    });
    elDetail.innerHTML = '';
    detalles.forEach(function (d) {
      var fila = document.createElement('div');
      fila.className = 'detail-row';
      var label = document.createElement('span');
      label.className = 'detail-label';
      label.textContent = d.label;
      var valor = document.createElement('span');
      valor.className = 'detail-value';
      valor.textContent = d.value;
      fila.appendChild(label);
      fila.appendChild(valor);
      elDetail.appendChild(fila);
    });

    // Estado
    var estado = meta.status || 'created';
    elStatus.textContent = ESTADOS[estado] || estado;
    elStatus.className = 'status status-' + estado;
    elStatus.style.display = 'inline-block';

    elLoading.style.display = 'none';
    elArtwork.style.display = 'block';
    elNotFound.style.display = 'none';
  }

  function mostrarNoEncontrado() {
    elLoading.style.display = 'none';
    elArtwork.style.display = 'none';
    elNotFound.style.display = 'block';
  }

  // Cargar y mostrar la obra
  function cargarObra(id) {
    elLoading.style.display = 'block';
    elArtwork.style.display = 'none';
    elNotFound.style.display = 'none';

    fetch(rutaMetadata(id))
      .then(function (resp) {
        if (!resp.ok) throw new Error('not found');
        return resp.json();
      })
      .then(function (meta) {
        // asegurar artwork_id
        if (!meta.artwork_id) meta.artwork_id = id;
        renderizar(meta);
      })
      .catch(function () {
        mostrarNoEncontrado();
      });
  }

  // Iniciar
  function iniciar() {
    var id = obtenerArtworkId();
    if (!id) {
      // sin hash: pantalla vacía / índice
      elLoading.style.display = 'none';
      elArtwork.style.display = 'none';
      elNotFound.style.display = 'block';
      document.getElementById('not-found').querySelector('p').textContent =
        'Sin obra solicitada. Agrega /#/art/ARTWORK_ID a la URL.';
      return;
    }
    cargarObra(id);
  }

  // escuchar cambios de hash (navegación)
  window.addEventListener('hashchange', iniciar);
  document.addEventListener('DOMContentLoaded', iniciar);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
