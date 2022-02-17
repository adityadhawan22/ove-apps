const log = OVE.Utils.Logger(Constants.APP_NAME, Constants.LOG_LEVEL);

$(function () {
    // This is what happens first. After OVE is loaded, either the viewer or controller
    // will be initialized.
    $(document).ready(function () {
        log.debug('Starting application');
        window.ove = new OVE(Constants.APP_NAME);
        log.debug('Completed loading OVE');
        window.ove.context.isInitialized = false;
        beginInitialization();
    });
});

updatePDF = async function () {
    window.ove.context.renderingInProgress = true;
    const context = window.ove.context;
    const state = window.ove.state.current;

    window.ove.state.cache();

    if (!context.isInitialized) {
        log.debug('Setting worker options for PDF.js');
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';

        context.factor = getScalingFactor();
        log.debug('Using scaling factor:', context.factor);

        context.isInitialized = true;
        log.debug('Application is initialized:', context.isInitialized);
    }

    if (context.url !== state.url || !context.pdf) {
        log.debug('Fetching document from url:', state.url);
        let pdf = await pdfjsLib.getDocument(state.url).promise;
        context.url = state.url;
        context.pdf = pdf;
        await renderPDF(context.pdf);
    } else {
        // The document was already fetched, it can be reused. This will enhance performance.
        await renderPDF(context.pdf);
    }

    log.debug('Finished updating PDF');
    context.renderingInProgress = false;
};

const onGetPage = async function (pdf, firstPage) {
    const state = window.ove.state.current;
    const g = window.ove.geometry;
    const pageGap = parseInt(state.settings.pageGap || Constants.DEFAULT_PAGE_GAP, 10);
    log.trace('Using page-gap:', pageGap);

    // The scale can be cached in the current state or provided as a configuration setting.
    // If this not provided the default value will be used.
    const scale = state.scale || state.settings.scale || Constants.DEFAULT_SCALE;
    log.trace('Using scale:', scale);

    let viewport = firstPage.getViewport({ scale: scale });
    let dim = {
        c: Math.floor(g.section.w / (viewport.width + pageGap)),
        r: Math.floor(g.section.h / (viewport.height + pageGap)),
        w: viewport.width,
        h: viewport.height
    };
    dim.border = {
        x: (g.section.w - (viewport.width + pageGap) * dim.c - pageGap) / 2,
        y: (g.section.h - (viewport.height + pageGap) * dim.r - pageGap) / 2
    };
    log.trace('Computed page dimensions:', dim);
    const page = await pdf.getPage(firstPage.pageNumber);
    await renderPage(pdf, page, scale, dim, firstPage, pageGap);
};

const panPage = async function (x, y) {
    const state = window.ove.state.current;
    const context = window.ove.context;
    if (context.renderingInProgress) return;

    state.offset.x = x * getScalingFactor();
    state.offset.y = y * getScalingFactor();

    log.debug('Updating offset:', state.offset);
    if (!OVE.Utils.JSON.equals(context.state, state)) {
        context.state = JSON.parse(JSON.stringify(state));
        await triggerUpdate();
    }
};

triggerUpdate = async function () {
    log.debug('Broadcasting state');
    OVE.Utils.broadcastState();
    await updatePDF();
};

const zoomPage = async function (zoom) {
    const state = window.ove.state.current;
    const context = window.ove.context;
    if (context.renderingInProgress) return;
    state.scale = zoom * (state.settings.scale || Constants.DEFAULT_SCALE);

    log.debug('Updating scale:', state.scale);
    if (!OVE.Utils.JSON.equals(context.state, state)) {
        // We only trigger updates if the state has really changed.
        context.state = JSON.parse(JSON.stringify(state));
        await triggerUpdate();
    }
};

initCommon = function () {
    window.ove.socket.addEventListener(async function (message) {
        if (!message || !window.ove.context.isInitialized || !message.operation) return;
        if (message.operation.zoom) {
            await zoomPage(message.operation.zoom);
        } else if (message.operation.x && message.operation.y) {
            await panPage(message.operation.x, message.operation.y);
        }
    });
};

const renderPage = async function (pdf, page, scale, dim, firstPage, pageGap) {
    const i = page.pageNumber;
    const state = window.ove.state.current;
    const context = window.ove.context;

    let viewport = page.getViewport({ scale: scale });
    let pageDim = { border: { x: 0, y: 0 } };
    if (viewport.width !== dim.w || viewport.height !== dim.h) {
        log.trace('The size or aspect ratio is different on page:', i);
        if (viewport.width / dim.w > viewport.height / dim.h) {
            // Scaling to fit width.
            const newScale = scale * dim.w / viewport.width;
            log.trace('Computed new scale:', newScale);

            viewport = page.getViewport(newScale);
            pageDim.border.y = (dim.h - viewport.height) / 2;
        } else {
            // Scaling to fit height.
            const newScale = scale * dim.h / viewport.height;
            log.trace('Computed new scale:', newScale);

            viewport = page.getViewport(newScale);
            pageDim.border.x = (dim.w - viewport.width) / 2;
        }
    }
    pageDim.h = viewport.height;
    pageDim.w = viewport.width;

    // Unless specified the default scroll direction depends on the number of rows and columns. If there
    // are more rows, then the scroll direction would default to horizontal otherwise it will always be
    // vertical.
    let scrollDir = (state.settings.scrolling ||
        (dim.c < dim.r ? Constants.Scrolling.HORIZONTAL : Constants.Scrolling.VERTICAL)).toLowerCase();
    if (scrollDir !== Constants.Scrolling.VERTICAL && scrollDir !== Constants.Scrolling.HORIZONTAL) {
        log.warn('Unknown scroll direction:', state.settings.scrolling);
        // If direction is unknown reset to default
        scrollDir = (dim.c < dim.r ? Constants.Scrolling.HORIZONTAL : Constants.Scrolling.VERTICAL);
    }
    log.trace('Using scroll direction:', scrollDir);

    let pageRow;
    let pageColumn;
    if (scrollDir === Constants.Scrolling.VERTICAL) {
        pageColumn = (i - firstPage.pageNumber) % dim.c;
        pageRow = Math.floor((i - firstPage.pageNumber) / dim.c);
    } else {
        pageColumn = Math.floor((i - firstPage.pageNumber) / dim.r);
        pageRow = (i - firstPage.pageNumber) % dim.r;
    }
    log.trace('Calculated page column:', pageColumn, 'and row:', pageRow);

    // The position of the page should take three things into consideration in addition to the page number:
    //     1. The overall border
    //     2. The offset if panning has taken place
    //     3. The page specific border if the aspect ratio is different to the first page
    // All of these values are calculated along both the x and y axes.
    const marginX = (state.offset.x || 0) + dim.border.x + pageDim.border.x + (dim.w + pageGap) * pageColumn;
    const marginY = (state.offset.y || 0) + dim.border.y + pageDim.border.y + (dim.h + pageGap) * pageRow;

    const css = {
        zoom: 1,
        transformOrigin: '0% 0%',
        transform: 'scale(' + (1 / context.factor) + ')',
        // Each client is loaded in its original size and then scaled-down.
        width: pageDim.w + 'px',
        height: pageDim.h + 'px',
        position: 'absolute',
        marginLeft: marginX / context.factor,
        marginTop: marginY / context.factor
        // opacity: 0
    };

    let pageCanvas = $(Constants.PAGE_CANVAS_NAME_PREFIX + i);
    if (pageCanvas.length === 0) {
        $('<canvas>', {
            id: Constants.PAGE_CANVAS_NAME_PREFIX.substring(1) + i
        }).css(css).appendTo(Constants.CONTENT_DIV);
        pageCanvas = $(Constants.PAGE_CANVAS_NAME_PREFIX + i);
        log.trace('Created canvas for page');
    } else {
        pageCanvas.css(css);
        log.trace('Repositioned canvas of page');
    }

    if (context.scale !== scale) {
        log.trace('Resizing canvas for page:', i);
        pageCanvas[0].height = pageDim.h;
        pageCanvas[0].width = pageDim.w;

        await page.render({
            canvasContext: pageCanvas[0].getContext('2d'),
            viewport: viewport
        }).promise;
        context.scale = scale;
    } else {
        context.renderingInProgress = false;
    }
};

renderPDF = async function (pdf) {
    log.debug('Starting PDF rendering');
    const state = window.ove.state.current;

    // Offsets may not be set
    if (!state.offset) {
        state.offset = { x: 0, y: 0 };
    }
    // Settings are optional
    if (!state.settings) {
        state.settings = {};
    }

    const pageNo = Number(state.settings.startPage || 1);
    const firstPage = await pdf.getPage(pageNo);
    await onGetPage(pdf, firstPage);
};
