import requests
import json
import webbrowser
import math
import uuid


class Space:
    def __init__(self, ove_host, space_name, ports=False, geometry=False):

        if not ove_host.startswith("http"):
            ove_host = "http://" + ove_host
        self.ove_host = ove_host

        self.space_name = space_name

        if not ports:
            # Listed in pm2.json
            ports = {'control': '8080',
                     'maps': '8081',
                     'images': '8082',
                     'html': '8083',
                     'videos': '8084',
                     'networks': '8085',
                     'charts': '8086',
                     'imagetiles': '8087'
                     }
        self.ports = ports

        self.geometry = geometry

        self.videos = Videos(self)

        self.row_height = 0
        self.col_width = 0
        self.num_rows = 0
        self.num_cols = 0

        self.set_grid(geometry["screen_rows"], geometry["screen_cols"])

        self.sections = []

    def set_grid(self, rows, cols):
        self.num_rows = rows
        self.num_cols = cols
        self.row_height = math.floor(self.geometry["height"] / rows)
        self.col_width = math.floor(self.geometry["width"] / cols)

    def set_quarter_grid(self):
        self.set_grid(2 * self.geometry["screen_rows"], 2 * self.geometry["screen_cols"])

    def add_section_by_grid(self, w, h, r, c, app_type, allow_oversized_section=False):

        if not allow_oversized_section:
            if (w + c) > self.num_cols:
                print("Section not created: would extend beyond space")
                return False
            if (r + h) > self.num_rows:
                print("Section not created: would extend beyond space")
                return False

        return self.add_section(w * self.col_width, h * self.row_height, c * self.col_width, r * self.row_height,
                                app_type, allow_oversized_section=allow_oversized_section)

    def delete_sections(self):
        delete("%s:%s/sections" % (self.ove_host, self.ports['control']))
        self.sections = []

    def add_section(self, w, h, x, y, app_type, allow_oversized_section=False):
        if app_type not in list(self.ports.keys()):
            print("%s is not a valid app type (%s are supported)" % (app_type, ", ".join(list(self.ports.keys()))))
            return False

        data = {"space": self.space_name,
                "w": w,
                "h": h,
                "x": x,
                "y": y,
                "app": {"url": self.ove_host + ":" + self.ports[app_type]}}

        if not allow_oversized_section:
            if (x + w) > self.geometry["width"]:
                print("Section not created: would extend beyond space")
                return False
            if (y + h) > self.geometry["height"]:
                print("Section not created: would extend beyond space")
                return False

        r = post("%s:%s/section" % (self.ove_host, self.ports['control']), json=data)

        section_id = json.loads(r.text)["id"]

        print("Created section %s: control page is %s:%s/control.html?oveSectionId=%s" % (
            section_id, self.ove_host, self.ports['control'], section_id))

        if app_type == "maps":
            section = MapSection(section_id, data, self)
        elif app_type == "images":
            section = ImageSection(section_id, data, self)
        elif app_type == "html":
            section = HTMLSection(section_id, data, self)
        elif app_type == "videos":
            section = VideoSection(section_id, data, self)
        elif app_type == "networks":
            section = NetworkSection(section_id, data, self)
        elif app_type == "charts":
            section = ChartSection(section_id, data, self)
        else:
            print("Don't know how to create section of type " + app_type)
            return False

        self.sections.append(section)
        return section

    def to_json(self, title):
        return {
            "Attribution": {"Title": title},
            "Sections": [section.to_json() for section in self.sections]
        }


class Videos:
    def __init__(self, space, exec_commands=True):
        self.space = space
        self.video_port = space.ports["videos"]
        self.exec_commands = exec_commands

    def play(self, params=False):
        request_url = "%s:%s/operation/play" % (self.space.ove_host, self.video_port)
        if self.exec_commands:
            get(request_url, params=params)

    def pause(self, params=False):
        request_url = "%s:%s/operation/pause" % (self.space.ove_host, self.video_port)
        if self.exec_commands:
            get(request_url, params=params)

    def stop(self, params=False):
        request_url = "%s:%s/operation/stop" % (self.space.ove_host, self.video_port)
        if self.exec_commands:
            get(request_url, params=params)

    def seek(self, time, params=False):
        request_url = "%s:%s/operation/seekTo&time=%s" % (self.space.ove_host, self.video_port, time)
        if self.exec_commands:
            get(request_url, params=params)


class Section(object):
    def __init__(self, section_id, section_data, space):
        self.section_id = section_id
        self.section_data = section_data
        self.space = space

    def delete(self):
        delete("%s:%s/section/%s" % (self.space.ove_host, self.space.ports['control'], self.section_id))
        self.space.sections.remove(self)

    def add_state(self, app, state_name, data):
        post("%s:%s/state/%s" % (self.space.ove_host, self.space.ports[app], state_name), json=data)
        print("Created state: %s:%s/state/%s" % (self.space.ove_host, self.space.ports[app], state_name))

    def to_json(self):
        return {
            "space": "OVE_SPACE",
            "h": self.section_data["h"],
            "w": self.section_data["w"],
            "x": self.section_data["x"],
            "y": self.section_data["y"],
            "app": self.get_app_json()
        }


class HTMLSection(Section):
    def __init__(self, section_id, section_data, space):
        super(HTMLSection, self).__init__(section_id, section_data, space)
        self.url = ""
        self.launch_delay = 0

    def set_url(self, url, launch_delay=0):
        self.url = url
        self.launch_delay = launch_delay

        request_url = "%s:%s/control.html?oveSectionId=%s&url=%s&launchDelay=%s" % (
            self.space.ove_host, self.space.ports['html'], self.section_id, url, launch_delay)

        print("To load URL, open: " + request_url)
        webbrowser.open(request_url)

    def get_app_json(self):
        return {
            "url": "OVE_APP_HTML",
            "states": {"load": {"url": self.url, "launchDelay": self.launch_delay}}
        }


class ImageSection(Section):
    def __init__(self, section_id, section_data, space):
        super(ImageSection, self).__init__(section_id, section_data, space)
        self.state = {}

    def set_url(self, url, name=""):
        if not name:
            name = str(uuid.uuid1())

        self.state = self.build_image_state(url)
        self.add_state('images', name, self.state)

        request_url = "%s:%s/control.html?oveSectionId=%s&state=%s" % (
            self.space.ove_host, self.space.ports['images'], self.section_id, name)

        print("To load image, open: " + request_url)
        webbrowser.open(request_url)

    @staticmethod
    def build_image_state(image_url):
        return {
            "config": {
                "panHorizontal": False,
                "wrapHorizontal": True,
                "visibilityRatio": 1,
                "wrapVertical": True,
                "panVertical": False,

                "tileSources": {
                    "url": image_url,
                    "type": "image"
                }
            }
        }

    def get_app_json(self):
        return {
            "url": "OVE_APP_IMAGES",
            "states": {"load": {"config": self.state, "position": {}}}
        }


class VideoSection(Section):
    def __init__(self, section_id, section_data, space):
        super(VideoSection, self).__init__(section_id, section_data, space)
        self.url = {}

    def set_url(self, video_url):
        self.url = video_url.replace('https://www.youtube.com/watch?v=', 'http://www.youtube.com/embed/')
        request_url = "%s:%s/control.html?oveSectionId=%s&url=%s" % (
            self.space.ove_host, self.space.ports['videos'], self.section_id, self.url)

        print("To load video, open: " + request_url)
        webbrowser.open(request_url)

    def get_app_json(self):
        return {
            "url": "OVE_APP_VIDEOS",
            "states": {"load": {"url": self.url}}
        }

    def play(self):
        self.space.videos.play({"oveSectionId": self.section_id})

    def pause(self):
        self.space.videos.pause({"oveSectionId": self.section_id})

    def stop(self):
        self.space.videos.stop({"oveSectionId": self.section_id})

    def seek(self):
        self.space.videos.seek({"oveSectionId": self.section_id})

class MapSection(Section):
    def __init__(self, section_id, section_data, space):
        super(MapSection, self).__init__(section_id, section_data, space)
        self.state = {}

    def set_position(self, name="", latitude=0, longitude=0, resolution=5000, zoom=5):
        # Note the maps app uses coordinates in Web Mercator projection (EPSG:900913)

        self.state = {
            "center": [str(latitude), str(longitude)],
            "resolution": str(resolution),
            "zoom": str(zoom)
        }
        self.add_state('maps', name, self.state)

        request_url = "%s:%s/control.html?oveSectionId=%s&state=%s" % (
            self.space.ove_host, self.space.ports['maps'], self.section_id, name)

        print("To load map, open: " + request_url)
        webbrowser.open(request_url)

    def get_app_json(self):
        # TODO: checkme
        return {
            "url": "OVE_APP_MAPS",
            "states": {"load": self.state}
        }


class NetworkSection(Section):
    def __init__(self, section_id, section_data, space):
        super(NetworkSection, self).__init__(section_id, section_data, space)
        self.state = {}

    def set_data(self, json_url="", gexf_url="", default_node_color="#ec5148", auto_rescale=True, name=""):
        self.state = {
            "settings": {
                "autoRescale": auto_rescale,
                "clone": False,
                "defaultNodeColor": default_node_color
            }
        }

        # N.B. additional settings are describe at: https://github.com/jacomyal/sigma.js/wiki/Settings

        if json_url:
            self.state["jsonURL"] = json_url
        elif gexf_url:
            self.state["gexfURL"] = gexf_url
        else:
            return "Must specify either a json_url or gexf_url as argument to set_data"

        if json_url and gexf_url:
            return "Both json and gexf URLs provided: gexf URL was ignored"

        if not name:
            name = str(uuid.uuid1())

        self.add_state('networks', name, self.state)

        request_url = "%s:%s/control.html?oveSectionId=%s&state=%s" % (
            self.space.ove_host, self.space.ports['networks'], self.section_id, name)

        print("To set network, open: " + request_url)
        webbrowser.open(request_url)

    def get_app_json(self):
        # TODO: checkme
        return {
            "url": "OVE_APP_NETWORKS",
            "states": {"load": self.state}
        }


class ChartSection(Section):
    def __init__(self, section_id, section_data, space):
        super(ChartSection, self).__init__(section_id, section_data, space)
        self.state = {}

    def set_specification(self, spec_url=False, spec=False, options=False, name=""):
        if not options:
            options = {}

        if not name:
            name = str(uuid.uuid1())

        self.state = {
            "options": options
        }

        if spec_url:
            self.state["specURL"] = spec_url
        elif spec:
            self.state["spec"] = spec

        self.add_state('charts', name, self.state)

        request_url = "%s:%s/control.html?oveSectionId=%s&state=%s" % (
            self.space.ove_host, self.space.ports['charts'], self.section_id, name)

        print("To load chart, open: " + request_url)
        webbrowser.open(request_url)

    def get_app_json(self):
        # TODO: checkme
        return {
            "url": "OVE_APP_CHARTS",
            "states": {"load": self.state}
        }


def get(url, params):
    try:
        r = requests.get(url, params)
        r.raise_for_status()
        return r
    except (requests.HTTPError, requests.Timeout, requests.ConnectionError) as e:
        print("Request failed:", e)


def post(url, json=""):
    try:
        r = requests.post(url, json=json)
        r.raise_for_status()
        return r
    except (requests.HTTPError, requests.Timeout, requests.ConnectionError) as e:
        print("Request failed:", e)


def delete(url):
    try:
        r = requests.delete(url)
        r.raise_for_status()
        return r
    except (requests.HTTPError, requests.Timeout, requests.ConnectionError) as e:
        print("Request failed:", e)
