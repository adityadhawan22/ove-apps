from .ove import Space


# Configuration for local testing
local_ports = {'control': '8080',
               'maps': '8081',
               'images': '8082',
               'html': '8083',
               'videos': '8084',
               'networks': '8085',
               'charts': '8086',
               'imagetiles': '8087'
               }

local_size = {
    'width': 1440,
    'height': 808,
    'screen_rows': 3,
    'screen_cols': 3
}

local_space = Space("localhost", "LocalNine", local_ports, local_size)


# Configuration for Data Observatory and DO-Dev
do_ports = {'control': '9080',
            'maps': '9081',
            'images': '9082',
            'html': '9083',
            'videos': '9084',
            'networks': '9085',
            'charts': '9086',
            'imagetiles': '9087'
            }

dodev_size = {
    'height': 4320,
    'width': 15360,
    'screen_rows': 2,
    'screen_cols': 4
}

do_size = {
    'height': 4320,
    'width': 30720,
    'screen_rows': 4,
    'screen_cols': 16
}

dodev = Space("gdo-appsdev.dsi.ic.ac.uk", "DODev", do_ports, dodev_size)
doprod = Space("gdo-appsdev.dsi.ic.ac.uk", "DOCluster", do_ports, do_size)
