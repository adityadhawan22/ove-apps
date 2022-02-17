const log = OVE.Utils.Logger(Constants.APP_NAME, Constants.LOG_LEVEL);

$(function () {
    // This is what happens first. After OVE is loaded the viewer will be initialized.
    $(document).ready(function () {
        log.debug('Starting application');
        window.ove = new OVE(Constants.APP_NAME);
        log.debug('Completed loading OVE');
        log.debug('Starting viewer initialization');
        OVE.Utils.initControl(Constants.DEFAULT_STATE_NAME, initView);
    });
});

initView = function (data) {
    let context = window.ove.context;
    context.isInitialized = false;
    log.debug('Application is initialized:', context.isInitialized);
    log.debug('Restoring state:', data);
    // If a URL was passed, the URL of the loaded state would be overridden.
    const mode = data.mode;
    const hostname = data.oveHost ? ('//' + data.oveHost) : context.hostname;
    log.debug('Viewer mode:', mode);
    log.debug('Replicating contents from host:', hostname);
    let urls = [];
    switch (mode) {
        case Constants.Mode.SPACE:
            if (hostname !== context.hostname && !data.spaceName) {
                log.warn('Space name must be provided when connecting to a remote host.');
                return;
            }
            urls[0] = hostname + '/sections?space=' + (data.spaceName || OVE.Utils.getSpace());
            break;
        case Constants.Mode.GROUP:
            if (!data.groupIds || !JSON.parse(data.groupIds).length) {
                log.warn('At least one group id must be provided in group mode');
                return;
            }
            JSON.parse(data.groupIds).forEach(function (id, i) {
                urls[i] = hostname + '/sections?groupId=' + id;
            });
            break;
        case Constants.Mode.SECTION:
            if (!data.sectionIds || !JSON.parse(data.sectionIds).length) {
                log.warn('At least one section id must be provided in section mode');
                return;
            }
            JSON.parse(data.sectionIds).forEach(function (id, i) {
                urls[i] = hostname + '/sections/' + id;
            });
            break;
        default:
            log.warn('Ignoring viewer mode:', mode);
            return;
    }
    let count = urls.length;
    let sections = {};
    urls.forEach(function (url) {
        fetch(url).then(function (r) { return r.text(); }).then(function (text) {
            let response = JSON.parse(text);
            log.trace('Got response:', response, 'from from URL:', url);
            // Prevent registration of own self and filter by space name.
            if (response instanceof Array) {
                response.forEach(function (section) {
                    if ((section.id !== +OVE.Utils.getSectionId() || hostname !== context.hostname) &&
                        (!data.spaceName || data.spaceName === section.space)) {
                        if (!sections[section.space]) {
                            sections[section.space] = [];
                        }
                        sections[section.space].push(section);
                    }
                });
            } else if ((response.id !== +OVE.Utils.getSectionId() || hostname !== context.hostname) &&
                (!data.spaceName || data.spaceName === response.space)) {
                if (!sections[response.space]) {
                    sections[response.space] = [];
                }
                sections[response.space].push(response);
            }
            count--;
            if (count === 0 && Object.keys(sections).length > 0) {
                let spaceName = Object.keys(sections)[0];
                if (Object.keys(sections).length > 1) {
                    let max = 0;
                    Object.keys(sections).forEach(function (space) {
                        if (sections[spaceName].length > max) {
                            spaceName = space;
                            max = sections[spaceName].length;
                        }
                    });
                }
                const sectionsToReplicate = sections[spaceName];
                log.info('Replicating', sectionsToReplicate.length, 'sections from space:', spaceName, 'on host:', hostname);
                if (sectionsToReplicate.length > 0) {
                    replicate(sectionsToReplicate, {
                        crop: data.crop || { x: 0, y: 0, w: Number.MAX_VALUE, h: Number.MAX_VALUE },
                        border: data.border ? '2px ' + data.border : 'none',
                        margin: data.border ? 4 : 0,
                        background: data.background || (data.border ? '#222' : 'none'),
                        hostname: hostname,
                        space: spaceName
                    });
                }
            }
            context.isInitialized = true;
            log.debug('Application is initialized:', context.isInitialized);
        });
    });
    OVE.Utils.resizeViewer(Constants.CONTENT_DIV);
};

replicate = function (sections, config) {
    let minMax = { x: { min: Number.MAX_VALUE, max: Number.MIN_VALUE }, y: { min: Number.MAX_VALUE, max: Number.MIN_VALUE } };
    sections.forEach(function (section) {
        minMax.x.min = Math.min(minMax.x.min, section.x);
        minMax.x.max = Math.max(minMax.x.max, section.x + section.w);
        minMax.y.min = Math.min(minMax.y.min, section.y);
        minMax.y.max = Math.max(minMax.y.max, section.y + section.h);
    });
    let bounds = {
        x: minMax.x.min + config.crop.x,
        y: minMax.y.min + config.crop.y,
        w: Math.min(minMax.x.max - minMax.x.min, config.crop.w),
        h: Math.min(minMax.y.max - minMax.y.min, config.crop.h)
    };
    log.debug('Calculated interim bounds:', bounds);
    let offset = { x: 0, y: 0 };
    let scale;
    const maxWidth = parseInt($(Constants.CONTENT_DIV).css('width'), 10) - config.margin;
    const maxHeight = parseInt($(Constants.CONTENT_DIV).css('height'), 10) - config.margin;
    log.debug('Calculated maximum width:', maxWidth, 'and height:', maxHeight);
    if (bounds.w * maxHeight >= maxWidth * bounds.h) {
        scale = maxWidth / bounds.w;
        offset.y = (maxHeight - maxWidth * bounds.h / bounds.w) / 2;
    } else {
        scale = maxHeight / bounds.h;
        offset.x = (maxWidth - maxHeight * bounds.w / bounds.h) / 2;
    }
    $('<div>', {
        class: Constants.SPACE_DIV.substring(1)
    }).css({
        zoom: 1,
        transformOrigin: '0% 0%',
        transform: 'translate(-' + bounds.x * scale + 'px,-' + bounds.y * scale + 'px)',
        width: bounds.w * scale + 'px',
        height: bounds.h * scale + 'px',
        // Each client is loaded in its original size and then scaled-down.
        position: 'absolute',
        marginLeft: offset.x,
        marginTop: offset.y,
        border: config.border,
        background: config.background,
        overflow: 'hidden'
    }).appendTo(Constants.CONTENT_DIV);

    const g = window.ove.geometry;
    const ox = g.x - offset.x - config.margin / 2;
    const oy = g.y - offset.y - config.margin / 2;
    let viewport = {
        x: bounds.x + Math.max(0, ox) / scale,
        y: bounds.y + Math.max(0, oy) / scale,
        w: (g.w + ox <= 0 ? 0 : g.w - ox < 0 ? g.w : g.w - ox) / scale,
        h: (g.h + oy <= 0 ? 0 : g.h - oy < 0 ? g.h : g.h - oy) / scale
    };
    if (viewport.w > 0 && viewport.x > bounds.x + bounds.w) {
        viewport.w -= bounds.x - viewport.x + bounds.w;
        if (viewport.w <= 0) {
            viewport.w = 0;
        }
    }
    if (viewport.h > 0 && viewport.y > bounds.y + bounds.h) {
        viewport.h -= bounds.y - viewport.y + bounds.h;
        if (viewport.h <= 0) {
            viewport.h = 0;
        }
    }
    log.debug('Computed viewport:', viewport, 'using bounds:', bounds, 'offset:', offset, 'and scale:', scale);

    if (viewport.w > 0 && viewport.h > 0) {
        fetch(config.hostname + '/spaces')
            .then(function (r) { return r.text(); }).then(function (text) {
                log.debug('Loading space:', config.space);
                let clients = JSON.parse(text)[config.space];
                clients.forEach(function (c, i) {
                    if (c.x !== undefined && c.y !== undefined && c.w !== undefined && c.h !== undefined &&
                        ((+c.x + c.w) > viewport.x && +c.x < (viewport.x + viewport.w)) &&
                        ((+c.y + c.h) > viewport.y && +c.y < (viewport.y + viewport.h))) {
                        $('<iframe>', {
                            src: config.hostname + '/view.html?oveViewId=' + config.space + '-' + i,
                            class: Constants.OVE_FRAME.substring(1),
                            allowtransparency: true,
                            frameborder: 0,
                            scrolling: 'no'
                        }).css({
                            zoom: 1,
                            transformOrigin: '0% 0%',
                            transform: 'scale(' + scale + ')',
                            // Each client is loaded in its original size and then scaled-down.
                            width: (c.w + (c.offset ? c.offset.x : 0)) + 'px',
                            height: (c.h + (c.offset ? c.offset.y : 0)) + 'px',
                            position: 'absolute',
                            marginLeft: (c.x - (c.offset ? c.offset.x : 0)) * scale,
                            marginTop: (c.y - (c.offset ? c.offset.y : 0)) * scale
                        }).appendTo(Constants.SPACE_DIV);
                    }
                });
                // Only displaying the subset of sections in the background.
                setTimeout(function () {
                    const filter = [];
                    sections.forEach(function (section) {
                        filter.push(section.id);
                    });

                    window.ove.frame.send(Constants.Frame.CHILD,
                        { load: true, transparentBackground: true, filters: { includeOnly: filter } }, 'core');
                }, Constants.FRAME_LOAD_DELAY);
            });
    }
};
