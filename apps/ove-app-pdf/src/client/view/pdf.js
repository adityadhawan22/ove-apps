initView = function () {
    window.ove.context.isInitialized = false;
    log.debug('Application is initialized:', window.ove.context.isInitialized);
    OVE.Utils.setOnStateUpdate(initThenUpdatePDF);
};

const initThenUpdatePDF = async function () {
    if (window.ove.state.current.isTransform) return;
    if (!window.ove.context.isCommonInitialized) {
        window.ove.context.isCommonInitialized = true;
        initCommon();
        await updatePDF();
    } else {
        await updatePDF();
    }
};

getScalingFactor = () => 1;

beginInitialization = function () {
    log.debug('Starting viewer initialization');
    OVE.Utils.initView(initView, updatePDF, function () {
        OVE.Utils.resizeViewer(Constants.CONTENT_DIV);
    });
};
