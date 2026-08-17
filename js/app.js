(function () {
    'use strict';

    var app = document.getElementById('app');

    function esc(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function notFound() {
        app.innerHTML = '<p class="notfound">Obra no encontrada.</p>';
    }

    function renderMetaList(meta) {
        var fields = [];
        if (meta.year) fields.push(['Año', meta.year]);
        if (meta.edition) fields.push(['Edición', meta.edition]);
        if (meta.status) fields.push(['Estado', meta.status]);
        if (meta.series) fields.push(['Serie', meta.series]);
        if (meta.technique) fields.push(['Técnica', meta.technique]);
        if (meta.dimensions) fields.push(['Dimensiones', meta.dimensions]);
        if (meta.location) fields.push(['Ubicación', meta.location]);
        if (meta.owner) fields.push(['Propietario', meta.owner]);

        if (!fields.length) return '';

        return '<ul class="meta">' + fields.map(function (f) {
            return '<li><span>' + esc(f[0]) + '</span><strong>' + esc(f[1]) + '</strong></li>';
        }).join('') + '</ul>';
    }

    function renderExhibitions(list) {
        if (!list || !list.length) return '';

        var items = list.map(function (e) {
            var html = '<li class="event">';
            html += '<div class="event-name">' + esc(e.name) + '</div>';
            if (e.date) html += '<div class="event-date">' + esc(e.date) + '</div>';
            if (e.description) html += '<div class="event-desc">' + esc(e.description) + '</div>';
            if (e.links) html += '<a class="event-link" href="' + esc(e.links) + '" target="_blank" rel="noopener">Enlace</a>';
            html += '</li>';
            return html;
        }).join('');

        return '<section class="section"><h2>Exposiciones</h2><ul class="events">' + items + '</ul></section>';
    }

    function renderOwnership(list) {
        if (!list || !list.length) return '';

        var items = list.map(function (o) {
            var type = o.type === 'transfer' ? 'Transferencia / Venta' : 'Propietario inicial';
            var owner = o.owner
                ? '<div class="owner">' + esc(o.owner) + '</div>'
                : '<div class="owner locked">&#128274; Propietario protegido</div>';

            var html = '<li class="event">';
            html += '<div class="event-type">' + esc(type) + '</div>';
            html += owner;
            if (o.date) html += '<div class="event-date">' + esc(o.date) + '</div>';
            if (o.notes) html += '<div class="event-desc">' + esc(o.notes) + '</div>';
            html += '</li>';
            return html;
        }).join('');

        return '<section class="section"><h2>Proveniencia</h2><ul class="events">' + items + '</ul></section>';
    }

    function render(meta, exhibitions, ownerships, id) {
        var image = meta.image
            ? '<img class="artwork-image" src="artworks/' + encodeURIComponent(id) + '/' + encodeURIComponent(meta.image) + '" alt="' + esc(meta.title) + '">'
            : '';

        var html = '<article class="artwork">';
        html += image;
        html += '<h1 class="title">' + esc(meta.title) + '</h1>';
        if (meta.artist) html += '<p class="artist">' + esc(meta.artist) + '</p>';
        html += renderMetaList(meta);
        if (meta.description) html += '<p class="description">' + esc(meta.description) + '</p>';
        html += renderExhibitions(exhibitions);
        html += renderOwnership(ownerships);
        html += '</article>';

        app.innerHTML = html;
    }

    var match = window.location.hash.match(/^#\/art\/([A-Za-z0-9._-]+)/);

    if (!match) {
        notFound();
        return;
    }

    var id = match[1].toUpperCase();

    Promise.all([
        fetch('artworks/' + id + '/metadata.json'),
        fetch('artworks/' + id + '/exhibitions.json'),
        fetch('artworks/' + id + '/ownership.json')
    ]).then(function (responses) {
        var metaRes = responses[0];
        var exRes = responses[1];
        var owRes = responses[2];

        if (!metaRes.ok) {
            notFound();
            return;
        }

        return Promise.all([
            metaRes.json(),
            exRes.ok ? exRes.json() : Promise.resolve([]),
            owRes.ok ? owRes.json() : Promise.resolve([])
        ]).then(function (data) {
            render(data[0], data[1], data[2], id);
        });
    }).catch(function () {
        notFound();
    });
})();
