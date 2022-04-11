import Paper, { Raster } from 'paper';
let paper = new Paper.PaperScope();
const Test = () => {
  var canvas = document.getElementById('canvas');
  var scope = paper.setup(new paper.Size(200, 200));

  var svg = 'implants/implant-20-x-85.svg';

  paper.project.importSVG(svg, function (pathItem: any) {
    // Get Path and CompoundPath which are children from this item
    let paths = pathItem.getItems({
      className: 'Path',
    });
    let compoundPaths = pathItem.getItems({
      className: 'CompoundPath',
    });

    // Filter paths that are inside CompoundPaths
    paths = paths
      .filter((p: any) => !compoundPaths.some((cp: any) => cp.children.includes(p)))
      // Filter paths that are used as clipping paths
      .filter((p: any) => !p.clipMask);
    compoundPaths = compoundPaths.filter((c: any) => !c.clipMask);

    // Close all paths to ensure a correct union
    for (const path of compoundPaths.filter((c: any) => !c.closed)) {
      path.closePath();
    }
    for (const path of paths.filter((c: any) => !c.closed)) {
      path.closePath();
    }

    // If not paths or compound paths are available, return the same input SVG
    if (!paths.length && !compoundPaths.length) {
      debugger;
    } else {
      // Merge all the paths to build a single path
      let unitedItem = undefined;
      let compoundPathsStartIndex = 0;
      if (paths.length) {
        unitedItem = paths[0];
        for (let n = 1; n < paths.length; ++n) {
          const path = paths[n];
          unitedItem = unitedItem.unite(path);
        }
      } else {
        unitedItem = compoundPaths[0];
        compoundPathsStartIndex = 1;
      }

      for (let n = compoundPathsStartIndex; n < compoundPaths.length; ++n) {
        const path = compoundPaths[n];
        unitedItem = unitedItem.unite(path);
      }

      // Set fill color otherwise paths exported in the server (which uses node 8) end up without
      //  a filling color
      unitedItem.fillColor = new paper.Color(0, 0, 0);

      // Generate the merged SVG string and save it
      const outputPathString = unitedItem.exportSVG({
        asString: true,
        bounds: new paper.Rectangle(0, 0, pathItem.getBounds().width, pathItem.getBounds().height),
      });
      // let outputSvg = outputPathString;
      let outputSvg = `<?xml version="1.0" encoding="utf-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" width="${
        pathItem.getBounds().width
      }" height="${pathItem.getBounds().height}">`;
      outputSvg += outputPathString;
      outputSvg += '</svg>';
      new Raster(outputPathString);
      console.log(outputSvg);
      //   debugger;
    }
  });
  return <canvas id="canvas"></canvas>;
};

export default Test;
