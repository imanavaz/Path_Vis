Trajectory visualisation.

### Usage:
 1. start http server: `$ python server.py`
 1. access `localhost:1080` using your favourite browser
 1. click a Marker to set the start POI
 1. slide to chose the preferred length (i.e., the number of POIs in trajectory)
 1. select the travel mode (used for rendering routes only)
 1. click the `Recommend` button

### Note:
 - the required python version to load the trained model is 3.5.3, other versions of python will cause "bad magic number" error.
 - on MacOS, please rename `lib/inference_lv_mac.so` to `lib/inference_lv.so` before starting `server.py`
 - only top-2 recommended trajectories are rendered.
