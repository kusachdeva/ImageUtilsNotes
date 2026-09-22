import * as CustomPaper from "./CustomPaper.js";
import { caseID, ROINumber, userID, feedback, taskID, phaseID } from "../index.js";
import { sliceParams, setCurrentSliceZoom } from "./CustomCornerstone.js";
import config from "../config.js";
import { deleteCurrentSVG, deleteCurrentCSV } from "./CustomPaper.js";
// import { ROI_MAPPING, ROI_EXPLANATION, ROI_DEFINITION, ROI_NAME } from "./RoiMapping.js";
// import { ROI_MAPPING, ROI_EXPLANATION, ROI_DEFINITION, ROI_NAME } from "./RoiMappingHeart.js";
import * as DefaultMapping from "./RoiMapping.js";
import * as HeartMapping from "./RoiMappingHeart.js";
let ROI_MAPPING, ROI_EXPLANATION, ROI_DEFINITION, ROI_NAME;
const checkTaskID = setInterval(() => {
  // Check if taskID is defined and is a valid value
  if (typeof taskID !== "undefined") {
    // Choose mapping based on taskID value
    if (taskID === "19") {
    ({ ROI_MAPPING, ROI_EXPLANATION, ROI_DEFINITION, ROI_NAME } = HeartMapping);
    } else {
    ({ ROI_MAPPING, ROI_EXPLANATION, ROI_DEFINITION, ROI_NAME } = DefaultMapping);
    }
    
    // Stop checking once taskID is defined
    clearInterval(checkTaskID);
    console.log("Mapping applied based on taskID:", taskID);
  }
  }, 100);
import { logFeatureBtn, logCustomAction } from "./Logger.js"

/////// GLOBAL VARIABLES ////////
const element = document.getElementById("dicomImage"); // to initialize Cornerstone.js
export let imgPointsMap = {}; // will not be required once we set up SVG handling
export let imgTransformMap = {}; // array of transformation parameters for every image
export let imgPathMap = {}; // array of SVGs for every image that will be stored in the database
export let contourPath;
export let contourPathPrev;
export let imageSliceIndex = 0;
export const TOTAL_SLICES = [
  0, 154, 171, 143, 159, 369, 233, 206, 176, 168, 196, 266, 141, 238, 187, 195,
  168, 168, 168,
];
const map = new Map();
export let imageViewTypes = ["ax", "cor", "sag"];
export let imageViewTypeIndex = 0;
let imageId = `${config.HOST}:${config.PORT}/api/get_slice?case_id=${caseID}&slice=${imageViewTypes[imageViewTypeIndex]}-${imageSliceIndex}`;
let delta = null;
export let cornerstone_default_scale = 0;
export let scaleToBeStored = 0;
export let presavedConflicts = [];
export let overlapRes = {};
export let DSC = {};

let circles = []
let gradientEnabled = false;
let groundTruthContourPath;
let maxContourPath = null;
let contourPaths = {};
let dotsFlag = false;
let dynamicFlag = false;
export let brushFlag = false;
let arrowFlag = false;
// let dotsThreshold = 0.8;
// let brushThreshold = 0.5;
// let arrowThreshold = 0.3;
// let dotsAvoidThreshold = 0.08;
// let brushAvoidThreshold = 0.15;
// let arrowAvoidThreshold = 0.3;
let drawnOnce = false;
let closeDots = false;


// const dynamicButton = document.getElementById('dynamic-btn');
// document.getElementById('dynamic-btn').addEventListener('click', () => {
//   dynamicFlag = !dynamicFlag
//   dynamicButton.querySelector(".button-text").innerHTML = dynamicFlag ? "Dynamic Threshold On" : "Dynamic Threshold Off"; // for button below other buttons

//   if (dynamicFlag === false) {
//     dotsFlag = false;
//     brushFlag = false;
//     arrowFlag = false;
//   }
// });

if (dynamicFlag === false) {
  const dotsButton = document.getElementById('dots-btn');
  document.getElementById('dots-btn').addEventListener('click', () => {
    dotsFlag = !dotsFlag
    dotsButton.querySelector(".button-text").innerHTML = dotsFlag ? "Dots On" : "Dots Off"; // for button below other buttons
    logFeatureBtn("dots", dotsFlag);
  });
  
  const brushButton = document.getElementById('brush-btn');
  document.getElementById('brush-btn').addEventListener('click', () => {
    brushFlag = !brushFlag
    brushButton.querySelector(".button-text").innerHTML = brushFlag ? "Brush On" : "Brush Off"; // for button below other buttons
    logFeatureBtn("brush", brushFlag);
  });
  
  const arrowButton = document.getElementById('arrow-btn');
  document.getElementById('arrow-btn').addEventListener('click', () => {
    arrowFlag = !arrowFlag
    arrowButton.querySelector(".button-text").innerHTML = arrowFlag ? "Arrow On" : "Arrow Off"; // for button below other buttons
    logFeatureBtn("arrow", arrowFlag);
  });
}

// const toggleButton = document.getElementById('toggleButton');
// document.getElementById('toggleButton').addEventListener('click', () => {
//   // gradientEnabled = !gradientEnabled;
//   // toggleButton.querySelector(".button-text").innerHTML = gradientEnabled ? "Gradient On" : "Gradient Off"; // for button below other buttons
//   // // toggleButton.innerText = gradientEnabled ? "Gradient On" : "Gradient Off"; // for button if separately at the bottom right corner
//   // applyColor(contourPath);
//   dotsFlag = !dotsFlag;
//   toggleButton.innerText = dotsFlag ? "Display Dots Once" : "Always Display Dots";

//   // reset drawnOnce and closeDots every time the user switches to "Display Dots Once"
//   if (dotsFlag) {
//     drawnOnce = false;
//     closeDots = false;
//   };
//   applyColorToPath(contourPath);
// });

// function clearCurrentContours(){
//
//
//   let xhttp = new XMLHttpRequest();
//   let slice_and_contours = {};
//   // paper.project.activeLayer.removeChildren()
//   // paper.view.draw();
//   contourPath.remove();
//   let imgFile = getImageId();
//   imgPathMap[imgFile] = "";
//   // imgPointsMap[imgFile] = null;
//   // delete imgPathMap[imgFile];
//   // delete imgPointsMap[imgFile];
//   sendC
//   // xhttp.onreadystatechange = function () {
//   //   slice_and_contours = {
//   //     coordinate: [],
//   //     slice: getImageId(),
//   //     case_id: caseID,
//   //     user_id: userID,
//   //   };
//   // }
//   // xhttp.open("POST", `https://52.10.167.1:80/api/set_contour`, true);
//   // xhttp.setRequestHeader("Content-Type", "application/json");
//   // xhttp.send(JSON.stringify(slice_and_contours));
//
//   // getContour();
//   // initialize();
//   // console.log(imgPointsMap[imgFile], imgPathMap[imgFile]);
//   // console.log(hasBeenCleared, " TESTING CLEAR")
// }
// let clearAllBtn = document.getElementById("clear-all-btn");
// clearAllBtn.addEventListener("click", ()=>{clearCurrentContours()});

/**s a
 * Preloads all of the slices if it is being run for the first time, otherwise initializend renders
 * the slice represented by the input param index, with appropriate zoom and translation.
 * @param index index number of the slice that is being initialized
 * @param zoom the zoom factor with which the slice needs to be scaled before rendering
 * @returns {Promise<void>} the successful/failed initialization of the slice
 */
export async function initialize(index, zoom) {
  if (phaseID === "1") {
    dynamicFlag = true;
  }

  if (index < 0 || index >= TOTAL_SLICES[parseInt(caseID)]) {
    alert("Input out of bound");
    return;
  }
  imageSliceIndex = index;
  cornerstoneWebImageLoader.external.cornerstone = cornerstone;

  // images (synonymous with slices) haven't been loaded before
  if (map["ax"] == null) {
    document.getElementById("loading").style.display = "flex";
    document.getElementById("loading-text").innerHTML = "Loading Images...";
    document.getElementById("canvasRegion").style.pointerEvents = "none";
    document.getElementById("navigationRegion").style.pointerEvents = "none";

    await preload(cornerstone, caseID);

    document.getElementById("loading").style.display = "none";
    document.getElementById("canvasRegion").style.pointerEvents = "auto";
    document.getElementById("navigationRegion").style.pointerEvents = "auto";

  }

  cornerstone.enable(element);
  delta = new Point(0, 0);

  try {
    cornerstone.displayImage(element, map["ax"][index]);

    if (cornerstone_default_scale === 0) {
      cornerstone_default_scale = cornerstone.getViewport(element).scale;
    }
    scaleToBeStored = cornerstone.getViewport(element).scale;
    await getContour();

    if (zoom) {
      paper.project.activeLayer.removeChildren();
      paper.view.zoom = 1;
      paper.view.draw();
      let viewport = cornerstone.getViewport(element);
      setCurrentSliceZoom(undefined, sliceParams.zoom, false);
      viewport.translation.x = sliceParams.x_translation_c;
      viewport.translation.y = sliceParams.y_translation_c;
    }

  } catch (error) {
    console.log(error); //displayImage Undefined Error is expected when loading
  }
  loadContourData(imageSliceIndex);
  
  if (dynamicFlag) {
    dotsFlag = false;
    brushFlag = false;
    arrowFlag = false;
    document.getElementById('dots-btn').querySelector(".button-text").innerHTML = "Dots Off";
    document.getElementById('brush-btn').querySelector(".button-text").innerHTML = "Brush Off";
    document.getElementById('arrow-btn').querySelector(".button-text").innerHTML = "Arrow Off";
  }
}

/**
 * Loads all of the images contained within the case represented by input param caseId
 * @param cornerstone cornerstone.js object
 * @param caseID the case ID from which images need to be loaded
 * @returns {Promise<void>} the successful/failed completion of preload
 */
async function preload(cornerstone, caseID) {
  //load the image and display it
  //const imageId = 'https://52.10.167.1/resources/ax-0';
  let progressBarObject = document.getElementById("myBar");
  let width = 0;
  let flag = true;

  map["ax"] = [];
  for (let j = 0; j < TOTAL_SLICES[parseInt(caseID)]; j++) {
    if (flag) {
      let id = `${config.HOST}:${config.PORT}/api/get_slice?case_id=${caseID}&slice=${imageViewTypes[0]}-${j}`;
      await cornerstone
        .loadImage(id)
        .then(function (image) {
          map["ax"].push(image);
          width += 100 / TOTAL_SLICES[parseInt(caseID)];
          progressBarObject.style.left = -100 + Math.floor(width) + "%";

        })
        .catch(() => {
          flag = false;
        });
    } else {
      break;
    }
  }
}

/**
 * @returns {string} path to the current image
 */
export function getImagePath() {
  return `resources/${imageViewTypes[imageViewTypeIndex]}-${imageSliceIndex}.png`;
}

/**
 * @returns {string} title of the current image
 */
export function getImageTitle() {
  return `image title: ${imageViewTypes[imageViewTypeIndex]}-${imageSliceIndex}`;
}

/**
 * Get contours for the next image
 */
export async function loadNextViewType() {
  imageViewTypeIndex = (imageViewTypeIndex + 1) % imageViewTypes.length;

  await getContour();
}

/**
 * @returns {string} ID of the current image
 */
export function getImageId() {
  imageId = `${config.HOST}:${config.PORT}/api/get_slice?case_id=${caseID}&slice=${imageViewTypes[imageViewTypeIndex]}-${imageSliceIndex}`;
  return `${imageViewTypes[imageViewTypeIndex]}-${imageSliceIndex}`;
}

/**
 * Loads the current minus nth image
 * @param n number of images to go back
 * @param isImageContentSet
 */
export function loadPreviousNImages(n, isImageContentSet) {
  if (imageSliceIndex - n < 0) {
    imageSliceIndex = 0;
  } else {
    imageSliceIndex = imageSliceIndex - n;
  }
  if (isImageContentSet) {
    imageId = `${config.HOST}:${config.PORT}/api/get_slice?case_id=${caseID}&slice=${imageViewTypes[imageViewTypeIndex]}-${imageSliceIndex}`;

    initialize(imageSliceIndex, true);
  }

  // getContour();
}

/**
 * toggles the button state
 */
export function toggleButtonState() {
  let next1Button = document.getElementById("next1");
  // TODO remove this temporary function after implementing all buttons
  if (imageViewTypes[imageViewTypeIndex] === "ax") {
    next1Button.disabled = false;
  } else {
    next1Button.disabled = true;
    imageSliceIndex = 0;
  }
}

/**
 * Loads the current plus nth image
 * @param n number of images to go forward
 * @param isImageContentSet
 */
export function loadNextNImages(n, isImageContentSet) {
  if (imageSliceIndex + n > TOTAL_SLICES[parseInt(caseID)] - 1) {
    imageSliceIndex = TOTAL_SLICES[parseInt(caseID)] - 1;
  } else {
    imageSliceIndex = imageSliceIndex + n;
  }
  if (isImageContentSet) {
    imageId = `${config.HOST}:${config.PORT}/api/get_slice?case_id=${caseID}&slice=${imageViewTypes[imageViewTypeIndex]}-${imageSliceIndex}`;

    initialize(imageSliceIndex, true);
  }
}

export async function getContour() {
  let slice = imageSliceIndex + 1;
  document.getElementById("slice").value = slice;

  let imgFile = `${imageViewTypes[imageViewTypeIndex]}-${imageSliceIndex}`;

  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState === 4 && this.status === 200) {
      let contours = JSON.parse(this.responseText).contour;
      let width = JSON.parse(this.responseText).width;
      let height = JSON.parse(this.responseText).height;
      let scale = JSON.parse(this.responseText).scale;
      let canvas = document.getElementsByClassName("cornerstone-canvas")[0];

      if (width !== null && height !== null) {
        let diffWidth = canvas.width - width;
        let diffHeight = canvas.height - height;
        delta = new Point(diffWidth / 2, diffHeight / 2);
      }

      if (contours !== "") {
        imgPathMap[imgFile] = contours;
        drawContour(null, false);
      } else {
        contourPath = new CompoundPath();
      }

      if (scale !== null && scale !== "") {
        scaleToBeStored = scale;
        let temp = cornerstone_default_scale / scale;
        paper.view.scale(temp);
      }
    }
  };
  xhttp.open(
    "GET",
    `${config.HOST}:${config.PORT
    }/api/get_contour_svg_new?task_id=${ROINumber}&feedback=${feedback}&case_id=${caseID}&user_id=${userID}&slice=${getImageId()}`,
    true
  );
  xhttp.send();
}

/**
 * Draw contours on the slice based on whether a contour -
 * (a) exists: then just parse the SVG and display it
 * (b) does not exist: this means that a user is currently drawing a contour, so create a path out of
 *     those points and create a contour
 * @param points points from the curve along which the user is drawing a contour
 * @param flag whether we are in refine mode or not
 */
export function drawContour(points, flag) {
  gradientEnabled = false; // toggle gradient off on new draw
  // toggleButton.querySelector(".button-text").innerHTML = "Gradient Off"; // for button below other buttons
  // toggleButton.innerText = "Gradient Off"; // for button if separately at the bottom right corner
  // applyColor();
  gradientEnabled = true;
  let imgFile = getImageId();

  if (!imgTransformMap[imgFile]) {
    imgTransformMap[imgFile] = {
      x_translation_p: 0,
      y_translation_p: 0,
    };
  }

  // check if there is already an existing path on this slice; if so, retrieve it and return
  if (!points && getImageId() in imgPathMap && flag === false) {
    // path for the current slice has already been stored
    // console.log("Length: ", imgPathMap[getImageId()].length);
    // retrieve the svg data from imgPathMap, parse and extract the data, create a new Compound path with it

    /* Reading problem might because of this*/
    let parser = new DOMParser();
    let xmlDoc = parser.parseFromString(imgPathMap[imgFile], "text/xml");
    let svgPathData = xmlDoc.getElementsByTagName("path")[0].getAttribute("d");
    let savedPath = new CompoundPath(svgPathData);

    savedPath.strokeColor = new Color(0, 0, 1);
    savedPath.strokeWidth = 2;
    savedPath.strokeJoin = "round";
    savedPath.closePath();
    contourPath = savedPath;

    // go through every element on the canvas and change positions according to the saved and current sliceparams
    // project.activeLayer.children.forEach(function (child) {
    paper = CustomPaper.userPaper;
    paper.project.activeLayer.children.forEach(function (child) {
      child.position = child.position.add(
        new Point(
          sliceParams.x_translation_p + delta.x,
          sliceParams.y_translation_p + delta.y
        )
      );
    });

    return;
  }

  ///////////////////////////////////////////////////////////////////////////////////////////

  setCurrentSliceZoom(undefined, sliceParams.zoom, false);

  let contourStroke;

  contourStroke = new Path.Circle({
    center: new Point(points[0][0], points[0][1]),
    radius: CustomPaper.brushSize
    // strokeColor: colors[0],
  });

  for (let i = 1; i < points.length; i++) {
    let next_contourStroke = new Path.Circle({
      center: new Point(points[i][0], points[i][1]),
      radius: CustomPaper.brushSize,
      // strokeColor: colors[i]
    });
    let res_contourStroke = contourStroke.unite(next_contourStroke);
    contourStroke.remove();
    contourStroke = res_contourStroke;
  }

  // change the aesthetics of the stroke
  contourStroke.strokeColor = new Color(0, 0, 1);
  contourStroke.strokeWidth = 2;
  contourStroke.strokeJoin = "round";
  // outer_path.smooth({ type: 'continuous' });
  contourStroke.smooth({ type: "catmull-rom", factor: 0.8 });
  contourStroke.simplify();
  contourStroke.closePath();

  // store the svg data of the created path into imgPath object

  imgPathMap[imgFile] = contourStroke.exportSVG({ asString: true });

  // why?11.4 click next and previous, the contour will be OK
  if (contourPath != null) {
    let tmp = contourStroke.unite(contourPath);
    contourStroke.remove();
    contourPathPrev = contourPath;
    contourPath.remove();
    contourPath = tmp;
    /*let tmp = contourPath.unite(contourStroke);
    contourPath.remove();
    contourPath = tmp;*/
  } else {
    contourPathPrev = contourPath;
    contourPath = contourStroke;
  }
  processUserPerformance();
  applyColor();

  imgTransformMap[getImageId()] = JSON.parse(JSON.stringify(sliceParams));
  imgPathMap[imgFile] = contourPath.exportSVG({ asString: true });

  // dotsFlag = false; // to turn off gradient dots after first contour
}

function applyColor() {
  if (!gradientEnabled) {
    circles.forEach((circle) => {
      circle.remove();
    });
    circles = [];
    contourPath.strokeColor = new Color(0, 0, 1);
  } else {
    // contourPath.strokeColor = new Color(0, 0, 1, 0);
    contourPath.strokeColor = new Color(0, 0, 1) // second version (sparse dots)
    if (contourPath) {
      circles.forEach((circle) => {
        circle.remove();
      });
      circles = [];
      if (contourPath instanceof CompoundPath) {
        contourPath.children.forEach((childPath) => {
          applyColorToPath(childPath, false);
        });
      } else {
        applyColorToPath(contourPath);
      }
    }
  }
}


function applyColorToPath(path, removeCircles = true) {
  // clear existing dots to re-populate dots
  if (removeCircles) {
    circles = [];
  }

  // // first time after switching to "Display Dots Once"
  // if (dotsFlag && !drawnOnce && !closeDots) {
  //   drawnOnce = true;
  //   return;
  // }

  // display dots if "Always Display Dots" OR second time after switching to "Display Dots Once"
  if (dotsFlag) {
    const totalSegments = path.segments.length;
    const numDots = Math.min(10, totalSegments * 0.7);

    // randomly select segments to place dots
    let randomSegmentIndices = [];
    while (randomSegmentIndices.length < numDots) {
      const random = Math.floor(Math.random() * totalSegments);
      if (!randomSegmentIndices.includes(random)) {
        randomSegmentIndices.push(random);
      }
    }

    // create random dots (max. 10 dots)
    randomSegmentIndices.forEach(index => {
      const segment = path.segments[index];
      const { x, y } = segment.point;
      const circle = new paper.Path.Circle({
        center: new paper.Point(x, y),
        radius: 2,
        fillColor: getColor(x, y),
      });
      circles.push(circle);
    });

    // // close dots if dots are already displayed (in "Display Dots Once" scenario)
    // if (dotsFlag && drawnOnce && !closeDots) {
    //   closeDots = true;
    // }
  }
}

// let groundTruthRegion = [
// 	new paper.Point(550, 400),
// 	new paper.Point(700, 400),
// 	new paper.Point(680, 450),
// 	new paper.Point(625, 500),
// 	new paper.Point(625, 350)
//   ];
/**
 * Given new points, refine the existing contour and save new SVG into imgSVGMap
 * @param points points from the curve along which the user is refining the contour
 * @param isInside whether the user is refining inside the existing contour
 */
export function refineContour(points, colors, isInside) {
  gradientEnabled = false; // toggle gradient off on new draw
  // toggleButton.querySelector(".button-text").innerHTML = "Gradient Off"; // for button below other buttons
  // toggleButton.innerText = "Gradient Off"; // for button if separately at the bottom right corner
  gradientEnabled = true;
  let refined_path;
  let final_contour = new Path();

  // initialize the refined path as a circle with the first point
  refined_path = new Path.Circle({
    // ?
    position: points[0],
    center: points[0],
    radius: CustomPaper.brushSize,
    fillColor: new Color(0, 0, 255, 0), // made transparent
  });

  //unite the points of the brush stroke to create a path
  for (let i = 1; i < points.length; i++) {
    let circle_i = new Path.Circle(
      new Point(points[i][0], points[i][1]),
      CustomPaper.brushSize
    );
    refined_path = refined_path.unite(circle_i);
    circle_i.remove();
  }

  if (isInside) {
    //unite the brush path and the main contour path
    final_contour = contourPath.unite(refined_path);
  } else {
    //subtract the brush path from the main contour path
    final_contour = contourPath.subtract(refined_path);
  }

  contourPathPrev = contourPath;
  contourPath.remove();
  contourPath = final_contour;
  refined_path.visible = false;
  contourPath.strokeColor = new Color(0, 0, 1);
  contourPath.strokeWidth = 2;

  processUserPerformance();
  applyColor();

  let isEmpty = (contourPath.closed !== true) && (contourPath.children === undefined);

  if (isEmpty) {
    //no points, delete svg file
    // console.log("No points, delete svg file");
    deleteCurrentSVG();
    // console.log("Delete csv file");
    deleteCurrentCSV();
    imgTransformMap[getImageId()] = JSON.parse(JSON.stringify(sliceParams));
  } else {
    // store the SVG data of the final path into the imgpath object
    imgTransformMap[getImageId()] = JSON.parse(JSON.stringify(sliceParams));
    imgPathMap[getImageId()] = contourPath.exportSVG({ asString: true });
  }

  // dotsFlag = false; // to turn off gradient dots after first contour

  return isEmpty;
}

/**
 * given two points (circles), match the connecting points (out of 3) that do not intersect
 * @param circle1
 * @param circle2
 * @param circle3
 * @returns [x1, y1, x1`, y1`, x2, y2, x2`, y2`]
 */
function matchNonIntersectingPoints(circle1, circle2, circle3) {
  // find the intersecting points of the first two circles
  let circles12_intersection_points = getIntersectionPoints(
    circle1[0],
    circle1[1],
    CustomPaper.brushSize,
    circle2[0],
    circle2[1],
    CustomPaper.brushSize
  );
  let circles12_ip1 = [
    circles12_intersection_points[0],
    circles12_intersection_points[2],
  ];
  let circles12_ip2 = [
    circles12_intersection_points[1],
    circles12_intersection_points[3],
  ];

  // find the intersecting points of the second two circles
  let circles23_intersection_points = getIntersectionPoints(
    circle2[0],
    circle2[1],
    CustomPaper.brushSize,
    circle3[0],
    circle3[1],
    CustomPaper.brushSize
  );
  let circles23_ip1 = [
    circles23_intersection_points[0],
    circles23_intersection_points[2],
  ];
  let circles23_ip2 = [
    circles23_intersection_points[1],
    circles23_intersection_points[3],
  ];

  if (
    doesIntersect(
      circles12_ip1[0],
      circles12_ip1[1],
      circles23_ip1[0],
      circles23_ip1[1],
      circle1[0],
      circle1[1],
      circle2[0],
      circle2[1]
    ) ||
    doesIntersect(
      circles12_ip1[0],
      circles12_ip1[1],
      circles23_ip1[0],
      circles23_ip1[1],
      circle2[0],
      circle2[1],
      circle3[0],
      circle3[1]
    )
  ) {
    // circles12_ip1 & circles23_ip2
    // circles12_ip2 & circles23_ip1
    return [
      circles12_ip1[0],
      circles12_ip1[1],
      circles23_ip2[0],
      circles23_ip2[1],
      circles12_ip2[0],
      circles12_ip2[1],
      circles23_ip1[0],
      circles23_ip1[1],
    ];
  } else {
    // circles12_ip1 & circles23_ip1
    // circles12_ip2 & circles23_ip2
    return [
      circles12_ip1[0],
      circles12_ip1[1],
      circles23_ip1[0],
      circles23_ip1[1],
      circles12_ip2[0],
      circles12_ip2[1],
      circles23_ip2[0],
      circles23_ip2[1],
    ];
  }
}
let groundTruthRegion = [
  new paper.Point(550, 390),
  new paper.Point(550, 500),
  new paper.Point(700, 500),
  new paper.Point(700, 390),
]; // For demo purpose only

export function translatePoints(points, hintcanvas = false) {
  const canvas = document.getElementById("hintCanvas");
  const ctx = canvas.getContext("2d");

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  const translatedPoints = points.map(point => {
    // translate pixel points to canvas points
    const pixelPoint = new paper.Point(parseFloat(point.x), parseFloat(point.y));
    const canvasPoint = cornerstone.pixelToCanvas(element, pixelPoint);

    return new paper.Point(canvasPoint.x, canvasPoint.y);
  });
  if (sliceParams.zoom != 1) {
    return translatedPoints.map(point => {
      const relativeX = point.x - centerX;
      const relativeY = point.y - centerY;
      const scaledX = relativeX / sliceParams.zoom;
      const scaledY = relativeY / sliceParams.zoom;
      let translate_x = 0;
      let translate_y = 0;
      if (hintcanvas) {
        translate_x = sliceParams.x_translation_p;
        translate_y = sliceParams.y_translation_p;
      }
      return new paper.Point(
        scaledX + centerX - translate_x,
        scaledY + centerY - translate_y
      );

    })
  }
  if (hintcanvas) {
    for (let point of translatedPoints) {
      point.x -= sliceParams.x_translation_p;
      point.y -= sliceParams.y_translation_p
    }
  }
  return translatedPoints
}

function getContourData(sliceIndex) {
  return new Promise((resolve, reject) => {
    let xhttp = new XMLHttpRequest();
    xhttp.open(
      "GET",
      `${config.HOST}:${config.PORT}/api/get_contour_data?slice_id=${sliceIndex}&task_id=${taskID}`,
      true
    );

    xhttp.setRequestHeader('Accept', 'application/json');
    xhttp.onreadystatechange = function () {
      if (this.readyState === 4) {
        if (this.status === 200) {
          try {
            const response = JSON.parse(this.responseText);
            if (response.ok) {
              resolve(response.contours);
            } else {
              reject(new Error(response.error || 'Unknown error occurred'));
            }
          } catch (error) {
            reject(new Error('Failed to parse response'));
          }
        } else {
          reject(new Error(`HTTP error! status: ${this.status}`));
        }
      }
    };

    xhttp.onerror = function () {
      reject(new Error('Network error occurred'));
    };

    xhttp.send();
  });
}

async function loadContourData(sliceIndex) {
  let contoursForSlice;
  try {
    contoursForSlice = await getContourData(sliceIndex);
  } catch (error) {
    console.error('Error fetching contour data:', error);
  }

  if (contoursForSlice[sliceIndex]) {
    presavedConflicts = Object.keys(contoursForSlice[sliceIndex])
    .filter(roi_num => roi_num in ROI_MAPPING) // TEMP FOR TESTING ONLY INCLUDE ROI THAT HAVE NAMES
    .map((roi_num, index) => {
      return {
        [`Hint ${index + 1}`]: {
          roi_num: roi_num,
          name: ROI_NAME[roi_num] || roi_num,
          roi_type: ROI_MAPPING[roi_num],
          triggered: false,
          drawn: false,
          color: "red",
          arrow_coord: findCenter(translatePoints(contoursForSlice[sliceIndex][roi_num], true)),
          arrow_trigger: ROI_MAPPING[roi_num] === "comp" || ROI_MAPPING[roi_num] === "consensus",
          highlight_coord: translatePoints(contoursForSlice[sliceIndex][roi_num], true),
          definition: ROI_DEFINITION[roi_num] || `Definition Missing`,
          explanation: ROI_EXPLANATION[roi_num] || `No explanation provided; This is a test message for a hint 
                        description. This is a test message for a hint 
                        description. This is a test message for a hint 
                        description. This is a test message for a hint 
                        description.`
        }
      };
    });

    const contoursArray = contoursForSlice[sliceIndex];
    contourPaths = {};

    for (const key in contoursArray) {
      const points = translatePoints(contoursArray[key]);

      if (points.length > 0) {
        // create path objects from points
        const contourPath = new paper.Path({
          segments: points,
          closed: true
        });

        contourPath.strokeColor = new paper.Color(0, 1, 0, 0); // made transparent; can remove the last 0 to see the contour 
        contourPath.smooth({ type: "catmull-rom", factor: 0.8 });
        contourPath.simplify();
        contourPaths[key] = contourPath;
      }
    }

    // contourPaths.sort((a, b) => a.area - b.area);

    // if (contourPaths) {
    //   maxContourPath = contourPaths[contourPaths.length - 1]; // temporary definition of max contour

    //   if (contourPaths.length > 1) {
    //     groundTruthContourPath = contourPaths[contourPaths.length - 3]; // temporary definition of consensus/groundtruth contour
    //   }
    // }
  } else {
    console.log(`No contour found for slice index: ${sliceIndex}`);
    groundTruthContourPath = null;
    maxContourPath = null;
  }
}

function isPointInsideContour(point, groundTruthContourPath) {
  const canvas = document.getElementById("myCanvas");
  const max_x_coord = canvas.width;
  const max_y_coord = canvas.height;
  let corner_points = [
    [0, 0],
    [max_x_coord, 0],
    [0, max_y_coord],
    [max_x_coord, max_y_coord],
    [max_x_coord / 2, 0],
    [max_x_coord / 2, max_y_coord],
    [0, max_y_coord / 2],
    [max_x_coord, max_y_coord / 2],
  ];

  for (let i = 0; i < 4; i++) {
    let corner_point = corner_points[i];
    let temp_path = new Path.Line(point, corner_point);
    if (!temp_path.intersects(groundTruthContourPath)) {
      temp_path.remove();
      return false;
    } else {
      temp_path.remove();
    }
  }
  return true;
}

// async function goBackContours() {
//   let xhttp = new XMLHttpRequest();
//   contourPath.remove();
//   contourPath = contourPathPrev;
//   paper.view.update();
//   // paper.view.draw();
//   let imgFile = getImageId();
//   imgTransformMap[getImageId()] = JSON.parse(JSON.stringify(sliceParams));
//   imgPathMap[imgFile] = contourPath.exportSVG({ asString: true });

//   let payload = {};
//   let element = document.getElementsByClassName("cornerstone-canvas")[0];
//   let parser = new DOMParser();
// 	let xmlDoc = parser.parseFromString(imgPathMap[imgFile], "text/xml");
// 	let svgPathData = xmlDoc.getElementsByTagName("path")[0].getAttribute("d");
// 	let savedPath = new CompoundPath(svgPathData);

// 	savedPath.children.forEach(function (child) {
// 		child.position.x -= imgTransformMap[imgFile].x_translation_p;
// 		child.position.y -= imgTransformMap[imgFile].y_translation_p;
// 	});

// 	let normalized_svg = savedPath.exportSVG({ asString: true });

//   xhttp.onreadystatechange = function () {
//     payload = {
//       coordinate: normalized_svg,
//       slice: imgFile,
//       case_id: caseID,
//       feedback: feedback,
//       task_id: ROINumber,
//       user_id: userID,
//       width: element.width,
//       height: element.height,
//       scale: scaleToBeStored,
//     };
//   };

//   xhttp.open(
//     "POST",
//     `${config.HOST}:${config.PORT}/api/set_contour_svg_new`,
//     true
//   );
//   xhttp.setRequestHeader("Content-Type", "application/json");
//   xhttp.send(JSON.stringify(payload));

//   await getContour();
// }

// let goBackBtn = document.getElementById("go-back-btn");
// goBackBtn.addEventListener("click", () => {
//   goBackContours();
//   // for logging
//   // logClearAllButton();
// });

function getColor(x, y, opacity = 1) {
  const point = new paper.Point(x, y);

  let color = `rgba(255, 0, 0, ${opacity})`;
  let isInsideConsensus = false;
  let isInsideComp = false;
  let isInsideAvoid = false;

  for (const roi in contourPaths) {
    const contourPath = contourPaths[roi];
    const roiType = ROI_MAPPING[roi];

    if (contourPath.contains(point)) {
      if ((roiType == "consensus") || (roiType == "include")) {
        isInsideConsensus = true;
      } else if (roiType == "comp") {
        isInsideComp = true;
      } else if (roiType == "avoid") {
        isInsideAvoid = true;
      }
    }
  }

  // const contourPath = contourPaths["83"];
  // console.log(contourPath);
  // const roiType = ROI_MAPPING["83"];
  // contourPath.strokeColor = new paper.Color(1, 0, 0);
  // console.log(contourPath.contains(point));
  // if (contourPath.contains(point)) {
  //   if ((roiType == "consensus") || (roiType == "include")) {
  //     isInsideConsensus = true;
  //   } else if (roiType == "comp") {
  //     isInsideComp = true;
  //   } else if (roiType == "avoid") {
  //     isInsideAvoid = true;
  //   }
  // }

  if (isInsideConsensus) {
    color = `rgba(0, 255, 0, ${opacity})`; // green for inside consensus
  } else if (isInsideComp) {
    color = `rgba(255, 165, 0, ${opacity})`; // orange for between consensus and comp
  } else {
    color = `rgba(255, 0, 0, ${opacity})`; // Strong red for inside "avoid"
  }
  return color;


  // // check if the cursor is inside the maximal contour
  // const isInsideMax = maxContourPath && maxContourPath.contains(point);
  // // check if the cursor is inside the ground truth contour
  // const isInsideGroundTruth = groundTruthContourPath && groundTruthContourPath.contains(point);
  // console.log(groundTruthContourPath);
  // const maxDistance = 1000;
  // const buffer = 10;

  // // Inside the consensus/ground truth contour (green)
  // if (isInsideGroundTruth) {
  //   // get distance from the cursor to the nearest point on the ground truth contour
  //   const nearestPointToGroundTruth = groundTruthContourPath.getNearestPoint(point);
  //   const distanceToGroundTruth = point.getDistance(nearestPointToGroundTruth);
  //   const calculatedOpacity = opacity * (1 - (distanceToGroundTruth / maxDistance));
  //   return `rgba(0, 255, 0, ${calculatedOpacity})`;
  // }

  // // Between consensus/ground truth and maximal contour (orange)
  // if (isInsideMax && !isInsideGroundTruth) {
  //   const nearestPointToGroundTruth = groundTruthContourPath.getNearestPoint(point);
  //   const distanceToGroundTruth = point.getDistance(nearestPointToGroundTruth);
  //   const calculatedOpacity = opacity * (1 - (distanceToGroundTruth / maxDistance));
  //   const redValue = (255 - distanceToGroundTruth);
  //   const greenValue = (165 - distanceToGroundTruth);
  //   return `rgba(${redValue}, ${greenValue}, 0, ${opacity})`;
  // }

  // // Outside the maximal contour (red)
  // const nearestPointToMax = maxContourPath.getNearestPoint(point);
  // const distanceToMax = point.getDistance(nearestPointToMax);
  // if (distanceToMax < buffer) {
  //   return `rgba(255, 165, 0, ${opacity})`;
  // } else {
  //   const redValue = (255 - (distanceToMax - buffer));
  //   return `rgba(${redValue}, 0, 0, ${opacity})`;
  // }
}

function getOverlapPercentage(userContour, roi) {
  const overlap = userContour.intersect(roi, { insert: false });
  const roiArea = roi.area;
  const overlapArea = overlap.area;
  overlap.remove();
  console.log("ROI", roi, "AREA", overlapArea);
  return (overlapArea / roiArea);
}

function getDSC(userContour, roi) {
  const overlap = userContour.intersect(roi, { insert: false });
  const overlapArea = overlap.area;
  overlap.remove();
  return (2 * overlapArea / (userContour.area + roi.area));
}

function getUserPerformance() {
  for (let roiKey in contourPaths) {
    overlapRes[roiKey] = 0
    DSC[roiKey] = 0
  }
  if (contourPath) {
    if (contourPath instanceof CompoundPath) {
      contourPath.children.forEach((childPath) => {
        for (let roiKey in contourPaths) {
          let roiContour = contourPaths[roiKey]
          let percentage = getOverlapPercentage(childPath, roiContour);
          let DSCnum = getDSC(childPath, roiContour);
          overlapRes[roiKey] = Math.max(percentage, overlapRes[roiKey]);
          DSC[roiKey] = Math.max(DSCnum, DSC[roiKey]);
        }
      });
    } else {
      for (let roiKey in contourPaths) {
        let roiContour = contourPaths[roiKey]
        let percentage = getOverlapPercentage(contourPath, roiContour);
        let DSCnum = getDSC(contourPath, roiContour);
        overlapRes[roiKey] = percentage;
        DSC[roiKey] = DSCnum;
      }
    }
  }

  return overlapRes;
}

function processUserPerformance() {
  let res = getUserPerformance();
  let roisTriggered = [];
  presavedConflicts.forEach(conflictObj => {
    const hintKey = Object.keys(conflictObj)[0];
    if (conflictObj[hintKey].arrow_trigger == true) {
      roisTriggered.push(conflictObj[hintKey].roi_num);
    }
  })

  console.log("Overlap res", res)

  let lowestInclude = Infinity;
  let highestAvoid = 0;
  let roiLowestInclude = null;
  let roiHighestAvoid = null;
  for (let roiKey in res) {
    if (roisTriggered.includes(roiKey) == false) {
      if (ROI_MAPPING[roiKey] === "include") {
        if (res[roiKey] < lowestInclude) {
          lowestInclude = res[roiKey];
          roiLowestInclude = roiKey;
          console.log(roiLowestInclude)
        }
      } else if (ROI_MAPPING[roiKey] === "avoid") {
        if (res[roiKey] !== 0 && res[roiKey] > highestAvoid) {
          highestAvoid = res[roiKey];
          roiHighestAvoid = roiKey;
        }
      }
    }
  }
  console.log("include percentage", res[roiLowestInclude], " for ROI ", roiLowestInclude);
  console.log("avoid percentage, ", res[roiHighestAvoid], " for ROI ", roiHighestAvoid);
  setFlags(res[roiLowestInclude], res[roiHighestAvoid]);

  if (arrowFlag) {
    let targetRois = [];
    if (roiLowestInclude !== null && roiHighestAvoid !== null) {
      if (res[roiLowestInclude] < (1 - res[roiHighestAvoid])) {
        targetRois = [roiLowestInclude];
      } else {
        targetRois = [roiHighestAvoid];
      }
    } else if (roiLowestInclude !== null) {
      targetRois = [roiLowestInclude];
    } else if (roiHighestAvoid !== null) {
      targetRois = [roiHighestAvoid];
    }
    presavedConflicts.forEach(conflictObj => {
      const hintKey = Object.keys(conflictObj)[0];
      // // for testing, show all arrows
      // let coord = conflictObj[hintKey].arrow_coord;
      // let color = "blue";
      // drawArrow(coord[0], coord[1], 50, 35, color);
      // draw arrow if covered avoid region
      if ((conflictObj[hintKey].roi_num == targetRois[0]) && conflictObj[hintKey].arrow_trigger == false) {
        let coord = conflictObj[hintKey].arrow_coord;
        let color = "red";
        if (conflictObj[hintKey].roi_num == roiLowestInclude) { 
          console.log("drawing green arrow for ROI", conflictObj[hintKey].roi_num)
          color = "green"
        } else {
          console.log("drawing red arrow for ROI", conflictObj[hintKey].roi_num)
        }

        let accuracy = 0;
        if (color == 'red') {
          accuracy = 1 - res[targetRois[0]];
        } else {
          accuracy = res[targetRois[0]];
        }

        if (accuracy <= 0.9) {
          drawArrow(coord[0], coord[1], 50, 35, color);
          conflictObj[hintKey].triggered = true;
          conflictObj[hintKey].arrow_trigger = true;
          logCustomAction("triggered arrow for roi " + conflictObj[hintKey].roi_num);
          const messageDiv = document.getElementById("feedback-message-div");
          let shortMessage = ROI_NAME[conflictObj[hintKey].roi_num] + ": " + conflictObj[hintKey].definition;
          messageDiv.innerHTML = `
              <div id="explanation-container">
                  <p style="font-size:20px;">${shortMessage}</p>
              </div>
          `;

          let feedback_div = document.getElementById("feedback-message-div");
          let explanationContainer = document.getElementById("explanation-container");

          // Style the container divs
          feedback_div.style.display = "flex";
          feedback_div.style.flexDirection = "column";
          feedback_div.style.height = "100%";
          explanationContainer.style.flexGrow = "1";
          explanationContainer.style.overflowY = "auto";
          explanationContainer.style.padding = "10px";

          // Create button container
          let buttonContainer = document.createElement("div");
          buttonContainer.style.position = "sticky";
          buttonContainer.style.bottom = "0";
          buttonContainer.style.padding = "10px";
          buttonContainer.style.display = "flex";
          buttonContainer.style.justifyContent = "space-between";
          buttonContainer.style.backgroundColor = "rgb(var(--sumi))";
          buttonContainer.style.borderTop = "1px solid #eee";

          // Create Go Back button
          let backButton = document.createElement("button");
          backButton.innerText = "Dismiss";
          backButton.style.padding = "10px 15px";
          backButton.style.border = "none";
          backButton.style.borderRadius = "5px";
          backButton.style.cursor = "pointer";
          backButton.style.backgroundColor = "#dc3545";
          backButton.style.color = "#ffffff";
          backButton.addEventListener("click", function() {
            feedback_div.innerHTML = "";
            clearArrows();
            logCustomAction("clicked dismiss");
          });

          let learnMoreButton = document.createElement("button");
          learnMoreButton.innerText = "Learn More";
          learnMoreButton.style.padding = "10px 15px";
          learnMoreButton.style.border = "none";
          learnMoreButton.style.borderRadius = "5px";
          learnMoreButton.style.cursor = "pointer";
          learnMoreButton.style.backgroundColor = "#007BFF";
          learnMoreButton.style.color = "#ffffff";
          learnMoreButton.addEventListener("click", function() {
              explanationContainer.innerHTML = `
                  <p>${ROI_NAME[conflictObj[hintKey].roi_num]}: ${conflictObj[hintKey].explanation}</p>
              `;
              
              learnMoreButton.remove();
              
              buttonContainer.style.justifyContent = "center";
              logCustomAction("clicked learn more");
          });


          buttonContainer.appendChild(backButton);
          buttonContainer.appendChild(learnMoreButton);

          feedback_div.appendChild(buttonContainer);
        }
      }
    });
  }

  return [roiLowestInclude, roiHighestAvoid]
}

function setFlags(includeOverlap, avoidOverlap) {
  if (dynamicFlag) {
    // if (includeOverlap <= dotsThreshold || avoidOverlap >= dotsAvoidThreshold) { dotsFlag = true; }
    // else { dotsFlag = false; } // dotsThreshold = 300
    // if (includeOverlap <= brushThreshold || avoidOverlap >= brushAvoidThreshold) { brushFlag = true; }
    // else { brushFlag = false; } // brushThreshold = 200
    // if (includeOverlap <= arrowThreshold || avoidOverlap >= arrowAvoidThreshold) { arrowFlag = true; }
    // else { arrowFlag = false; } // arrowThreshold = 100
    if (includeOverlap <= 0.9 || avoidOverlap >= 0.1) {
      dotsFlag = true;
      brushFlag = true;
      arrowFlag = true;
      document.getElementById('dots-btn').querySelector(".button-text").innerHTML = "Dots On";
      document.getElementById('brush-btn').querySelector(".button-text").innerHTML = "Brush On";
      document.getElementById('arrow-btn').querySelector(".button-text").innerHTML = "Arrow On";
      logCustomAction("Automatic feedback on");
    }
    console.log("dotsflag", dotsFlag);
    console.log("brushflag", brushFlag);
    console.log("arrowflag", arrowFlag);

    
  }
}

// takes characteristics of two circles, and returns two points of intersection
function getIntersectionPoints(x0, y0, r0, x1, y1, r1) {
  let a, dx, dy, d, h, rx, ry;
  let x2, y2;

  /* dx and dy are the vertical and horizontal distances between
   * the circle centers.
   */
  dx = x1 - x0;
  dy = y1 - y0;

  /* Determine the straight-line distance between the centers. */
  d = Math.sqrt(dy * dy + dx * dx);

  /* Check for solvability. */
  if (d > r0 + r1) {
    /* no solution. circles do not intersect. */
    return false;
  }
  if (d < Math.abs(r0 - r1)) {
    /* no solution. one circle is contained in the other */
    return false;
  }

  /* 'point 2' is the point where the line through the circle
   * intersection points crosses the line between the circle
   * centers.
   */

  /* Determine the distance from point 0 to point 2. */
  a = (r0 * r0 - r1 * r1 + d * d) / (2.0 * d);

  /* Determine the coordinates of point 2. */
  x2 = x0 + (dx * a) / d;
  y2 = y0 + (dy * a) / d;

  /* Determine the distance from point 2 to either of the
   * intersection points.
   */
  h = Math.sqrt(r0 * r0 - a * a);

  /* Now determine the offsets of the intersection points from
   * point 2.
   */
  rx = -dy * (h / d);
  ry = dx * (h / d);

  /* Determine the absolute intersection points. */
  let xi = x2 + rx;
  let xi_prime = x2 - rx;
  let yi = y2 + ry;
  let yi_prime = y2 - ry;

  return [xi, xi_prime, yi, yi_prime];
}

// returns true if the line from (a,b)->(c,d) intersects with (p,q)->(r,s)
function doesIntersect(a, b, c, d, p, q, r, s) {
  let det, gamma, lambda;
  det = (c - a) * (s - q) - (r - p) * (d - b);
  if (det === 0) {
    return false;
  } else {
    lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
    gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
    return 0 < lambda && lambda < 1 && 0 < gamma && gamma < 1;
  }
}

/**
 * The following function has been borrowed and modified from Raphael Monnerat's (GitHub username: Shinao)
 * code on GitHub that has been released under the MIT License.
 * Link to the GitHub repository: https://github.com/Shinao/PathToPoints
 * Complete license can be found in the README under the directory iContourVanillaWeb
 */
export function generatePointsFromSvg(svg_data) {
  let path = svg_data.replace(" ", ",");

  let all_points = [];

  // get points at regular intervals
  for (let c = 0; c < Raphael.getTotalLength(path); c++) {
    let point = Raphael.getPointAtLength(path, c);
    all_points.push([point.x, point.y]);
  }

  return all_points;
}

function rotatePoint(px, py, cx, cy, angle) {
  const radians = angle * (Math.PI / 180);
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const xNew = cos * (px - cx) - sin * (py - cy) + cx;
  const yNew = sin * (px - cx) + cos * (py - cy) + cy;

  return { x: xNew, y: yNew };
}

// draw arrow to point at ROI for contouring
export async function drawArrow(x, y, length, angle, color) {
  const canvas = document.getElementById("hintCanvas");
  const ctx = canvas.getContext("2d");
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 0.5;
  ctx.lineCap = 'square';

  let translate_x = sliceParams.x_translation_p;
  let translate_y = sliceParams.y_translation_p;

  const points = [
    { x: 0, y: 0 },
    { x: -7, y: 15 },
    { x: -1.5, y: 15 },
    { x: -1.5, y: length },
    { x: 1.5, y: length },
    { x: 1.5, y: 15 },
    { x: 7, y: 15 },
    { x: 0, y: 0 }
  ];
  const rotatedPoints = points.map(point => rotatePoint(point.x + x, point.y + y, x, y, angle));

  ctx.beginPath();
  ctx.moveTo(rotatedPoints[0].x + translate_x, rotatedPoints[0].y + translate_y);
  for (let i = 1; i < rotatedPoints.length; i++) {
    ctx.lineTo(rotatedPoints[i].x + translate_x, rotatedPoints[i].y + translate_y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

export function clearArrows() {
  const canvas = document.getElementById("hintCanvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export function findCenter(points) {
  let totalX = 0;
  let totalY = 0;

  points.forEach(point => {
    totalX += point.x;
    totalY += point.y;
  });
  const centerX = totalX / points.length;
  const centerY = totalY / points.length;

  return [centerX, centerY];
}

export async function highlightROI(points, color, translate = false) {
  const canvas = document.getElementById("hintCanvas");
  const ctx = canvas.getContext("2d");
  ctx.lineWidth = 1.25;
  let translate_x = sliceParams.x_translation_p;
  let translate_y = sliceParams.y_translation_p;
  ctx.beginPath();
  ctx.moveTo(points[0].x + translate_x, points[0].y + translate_y);
  ctx.strokeStyle = color;

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x + translate_x, points[i].y + translate_y);
  }

  ctx.closePath();
  ctx.stroke();
}

export async function removeArrow() {
  const canvas = document.getElementById("hintCanvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export async function drawHighlights(translate = false) {
  for (let i = 1; i < presavedConflicts.length + 1; i++) {
    if (presavedConflicts[i - 1]["Hint " + i].drawn == true) {
      // need to make this more efficient in the future
      let highlightCoordinate = presavedConflicts[i - 1]["Hint " + i].highlight_coord;
      let color = presavedConflicts[i - 1]["Hint " + i].color;
      highlightROI(highlightCoordinate, color, translate);
    }
  }
}

export function getContourPaths() {
  return contourPaths;
}
