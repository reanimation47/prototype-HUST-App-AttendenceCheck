const video = document.getElementById('video')
let attendeesList = {} //Array to store attendees
let scan_frequency = 200 // in ms
let studentId_to_studentName = {}

// const studentId_to_studentName = {
//   20198323 : "Le Doan Anh Quan",
//   12345678 : "Captain America",
//   1111: "Jim"
// }
let labels = []
let studentId_to_arrivalTime = {}

class Attendee 
{
    name;
    studentId;

    constructor(name, Id)
    {
        this.name = name
        this.studentId = Id
    }

    getId()
    {
        return this.studentId
    }

    getName()
    {
        return this.name
    }
}

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(startVideo)

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    stream => video.srcObject = stream,
    err => console.error(err)
  )
}

video.addEventListener('play', async () => {
  let _labelsdata = await getData('get_student_ids')
  labels = _labelsdata.received
  console.log("logging " +labels)
  let _id_data = await getData('get_id_table')
  studentId_to_studentName = _id_data.received

  //const canvas = faceapi.createCanvasFromMedia(video)
  const canvas = document.getElementById('app-canvas')
  //document.body.append(canvas)
  const displaySize = { width: video.width, height: video.height }
  let i = 0
  faceapi.matchDimensions(canvas, displaySize)
  const labeledFaceDescriptors = await loadLabeledImages()
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)
  setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions().withFaceDescriptors()
    const resizedDetections = faceapi.resizeResults(detections, displaySize)
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)

    //faceapi.draw.drawDetections(canvas, resizedDetections)
    //faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
    //faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
    if (i < 100000000) {
      if (detections.length == 0) {return}
      const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
      //console.log(results[0]._label)
      drawRecognizedFaces(results, canvas, resizedDetections)
      i ++
    }
  }, scan_frequency)
})

function drawRecognizedFaces(results, _canvas, detectedFaces){
    results.forEach( async (result, i) => {
        const current = new Date()
        //console.log(result._label + "/" + current.getHours() + ":" + current.getMinutes() + ":" + current.getSeconds())
        const box = detectedFaces[i].detection.box
        const score = detectedFaces[i].detection.score
        if (score <0.85)
        {
          return;
        }
        console.log(score)
        const drawBox = new faceapi.draw.DrawBox(box, { 
            //label: result.toString()
            label: studentId_to_studentName[Number(result._label)]
        })
        drawBox.draw(_canvas)
        //console.log("drawww")
        await addAttendees(result._label) // add recognized attendees
      })
}

async function addAttendees(attendeeId) //add new attendees detected to the list -- and returns the attendee's name
{
    if (attendeesList[attendeeId] != null) {return}
    if (attendeeId == "unknown") {return}
    let current = new Date()
    console.log("iddd: " + attendeeId)
    

    attendeesList[attendeeId] = studentId_to_studentName[attendeeId]
    studentId_to_arrivalTime[attendeeId] = current.getHours() + ":" + current.getMinutes()

    console.log("added new attendee: " + studentId_to_studentName[attendeeId] + " \n arrival time: " + studentId_to_arrivalTime[attendeeId])

    console.log(Object.keys(attendeesList).length)
    console.log(Object.keys(attendeesList))
    const response = await postData('add_attendee', { data: attendeeId })
    //console.log(response)
    return studentId_to_studentName[attendeeId]
}


function loadLabeledImages() {
  //labels = ['Black Widow', '12345678', 'Captain Marvel', 'Hawkeye', '1111', 'Thor', 'Tony Stark', '20198323']
  return Promise.all(
    labels.map(async label => {
      const descriptions = []
      for (let i = 1; i <= 4; i++) {
        const img = await faceapi.fetchImage(`./labeled_images/${label}/${i}.jpg`)
        const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
        descriptions.push(detections.descriptor)
      }

      return new faceapi.LabeledFaceDescriptors(label, descriptions)
    })
  )
}



async function postData(url = '', data = {}) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    //mode: 'no-cors', // no-cors, *cors, same-origin
    //cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    //credentials: 'same-origin', // include, *same-origin, omit
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    //redirect: 'follow', // manual, *follow, error
    //referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify(data) // body data type must match "Content-Type" header
  });
  console.log("postdata")
  return response.json(); // parses JSON response into native JavaScript objects
}

async function getData(url = '', data = {}) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: 'GET', // *GET, POST, PUT, DELETE, etc.
    //mode: 'no-cors', // no-cors, *cors, same-origin
    //cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    //credentials: 'same-origin', // include, *same-origin, omit
    headers: {
      'Content-Type': 'application/json'
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    //redirect: 'follow', // manual, *follow, error
    //referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    //body: JSON.stringify(data) // body data type must match "Content-Type" header
  });
  //console.log(response.json())
  return response.json(); // parses JSON response into native JavaScript objects
}

// postData('http://localhost:3000/api', { data: 42 })
//   .then((data) => {
//     console.log(data); // JSON data parsed by `data.json()` call
//   });