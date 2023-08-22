# Interactive 3D visualization of geographical data based on open sources using web technologies
Bachelor's thesis and project.

**Thesis:** [W04_241292_2020_praca inżynierska.pdf](https://github.com/damiankoper/geovis/blob/master/docs/out/W04_241292_2020_praca%20in%C5%BCynierska.pdf)

**TL;DR Showcase:** https://www.youtube.com/playlist?list=PLyeCQ8hecTFeg8e4jMXlo86sxF_HxElCp

Run example visualizations in Storybook:
```sh
docker run -p 8080:80 kopernick/geovis-core-storybook:latest
```

### What's in here?

For my Bachelor's thesis, I've implemented a library for developing geographical visualizations for the web and an example application that utilizes it. The library provides basic orbit camera abstractions and controls. The visualization system is fully extensible, allowing one visualization to be built on top of another.

Directories:
* **docs** - LaTeX source and output of the thesis
* **engine** - geographical visualization library with example visualizations
* **testTileService** - service simulating OpenStreetMap endpoints to test visualization based on tiles
* **app** - SPA that imports the **engine** library and allows switching between visualizations

### Example visualizations

#### Earth
![image](https://github.com/damiankoper/geovis/assets/28621467/a10b5dea-775e-46ca-bc42-4371842f5b3e)
#### Satellites of choice live (https://celestrak.org/)
![image](https://github.com/damiankoper/geovis/assets/28621467/370e1015-bdc8-4fae-bccf-932538d21343)
#### Weather Tiles (OSM + https://www.rainviewer.com/)
![image](https://github.com/damiankoper/geovis/assets/28621467/a9a9e9d7-9d57-4c0c-8060-9872cbe3c99d)
#### Active satellites live (https://celestrak.org/)
![image](https://github.com/damiankoper/geovis/assets/28621467/69efb3b1-5ab7-40ec-8498-26d03a3d5943)
