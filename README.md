Trajectory visualisation.

### Usage:
 1. start http server: `$ python server.py`
 1. access `localhost:1080` using your favourite browser
 1. click a Marker to set the start POI
 1. slide to chose the preferred length (i.e., the number of POIs in trajectory)
 1. select the travel mode (used for rendering routes only)
 1. click the `Recommend` button

### Note:
 - the required `python` version to load the trained model is 3.5.3, other versions of python will cause "bad magic number" error.
 - the required `pandas` version is 0.19.2, other versions may cause "import error".
 - only top-2 recommended trajectories are rendered.
