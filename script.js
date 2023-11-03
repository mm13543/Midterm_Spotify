let s = new SpotifyWebApi();
let audio;
let playlists = []; // Store playlists data here
let balls = []; // Store balls for energetic playlists

class Playlist {
  constructor(name, description) {
    this.name = name;
    this.description = description;
    this.mood = this.getMoodFromDescription(description);
    this.shape = "rect"; // Default shape is a rectangle
    this.starColor = color(random(255), random(255), random(255)); // Initialize with a random color
  }

  getMoodFromDescription(description) {
    // Convert the description to lowercase for case-insensitive matching
    description = description.toLowerCase();

    if (description.includes("happy") || description.includes("joyful")) {
      return "happy";
    } else if (description.includes("relaxed") || description.includes("chill")) {
      return "relaxed";
    } else if (description.includes("energetic") || description.includes("upbeat")) {
      return "energetic";
    } else {
      return "unknown";
    }
  }

  // Method to change the shape of the playlist
  changeShapeToStar() {
    this.shape = "star";
    this.starColor = color(random(255), random(255), random(255)); // Change to a new random color
  }
}

function setup() {
  createCanvas(1800,1800);
  audio = new Audio();
  initializeSpotify();
}

function getURLQuery(url, param) {
  var urlParams = new URLSearchParams(url);
  return urlParams.get(param);
}

function authorizeSpotify() {
  var authURL = "https://accounts.spotify.com/authorize?client_id=a8c0f49a02a74e47957184e62d991d0d&response_type=token&scope=playlist-modify-private user-top-read";
  var authRedirect = "&redirect_uri=" + encodeURIComponent("http://localhost:5500/"); 
  window.location.href = authURL + authRedirect;
}

function initializeSpotify() {
  let url = window.location.href;
  url = url.substring(22);
  url = url.replace("#", "?");
  var token = getURLQuery(url, 'access_token');
  if (!token) {
    window.alert("Please authorize your Spotify account.");
  } else {
    s.setAccessToken(token);
    getUserPlaylists();
  }
}

function createNewPlaylist() {
  var name = prompt('name of playlist');
  var description = 'automatically created playlist';
  const isPublic = false;
  var userId = prompt('enter your user id');
  token = 'Bearer '+s.getAccessToken();
  const xhr = new XMLHttpRequest();
  xhr.open("POST", 'https://api.spotify.com/v1/users/'+userId+'/playlists');
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.setRequestHeader("Authorization", token);
  const body = JSON.stringify({
    'name': name,
    'description': description,
    'public': isPublic
  });
  xhr.onload = () => {
    if (xhr.readyState == 4 && xhr.status == 201) {
      console.log(JSON.parse(xhr.responseText));
    } else {
      console.log(`Error: ${xhr.status}`);
    }
  };
  xhr.send(body);
}

function getUserPlaylists() {
  s.getUserPlaylists().then(function (data) {
    playlists = data.items.map(item => new Playlist(item.name, item.description));
    // Now that you have the playlists, you can display them using p5.js
  }).catch(function (error) {
    console.error('Error getting user playlists:', error);
  });
}

function draw() {
  background(220);

  // Display user's playlists
  let x = 20;
  let y = 50;
  const spacing = 150;

  for (let playlist of playlists) {
    // Display mood as a colored shape
    fill(getMoodColor(playlist.mood));
    noStroke();
    if (playlist.shape === "star") {
      // Change the color of the star constantly
      playlist.starColor = color(random(255), random(255), random(255));
      fill(playlist.starColor);
      drawStar(x + 60, y + 60, 30, 60, 5); // Draw a smaller star for "happy" mood
    } else if (playlist.shape === "ellipse") {
      ellipse(x + 60, y + 60, 120, 120); // Draw an ellipse for "happy" mood
    } else {
      rect(x, y, 120, 120); // Draw a rectangle for other moods
    }

    // Display playlist name
    textSize(14);
    fill(0); // Black text color
    text(playlist.name, x, y + 140);

    x += spacing;
  }

  // Update and display the balls for energetic playlists
  updateBalls();
}

function getMoodColor(mood) {
  // Define color mappings for different moods
  let moodColors = {
    "happy": color(255, 0, 0),      // Red for happy mood
    "relaxed": color(0, 255, 0),    // Green for relaxed mood
    "energetic": color(0, 0, 255), // Blue for energetic mood
    "unknown": color(128, 128, 128) // Gray for unknown mood
  };

  return moodColors[mood] || color(128, 128, 128); // Default to gray for unknown moods
}

function updateBalls() {
  for (let ball of balls) {
    ball.move();
    ball.display();
  }
}

class Ball {
  constructor(x, y, radius, fillColor) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.fillColor = fillColor;
    this.xSpeed = random(-5, 5);
    this.ySpeed = random(-5, 5);
  }

  move() {
    this.x += this.xSpeed;
    this.y += this.ySpeed;
  }

  display() {
    fill(this.fillColor);
    noStroke();
    ellipse(this.x, this.y, this.radius * 2);
  }
}

function mousePressed() {
  for (let i = 0; i < playlists.length; i++) {
    let x = 20 + i * 150;
    let y = 50;
    if (mouseX > x && mouseX < x + 120 && mouseY > y && mouseY < y + 120) {
      // Check if the mouse was clicked inside a playlist rectangle
      if (playlists[i].mood === "happy") {
        // If the playlist has the mood "energetic," generate random balls
        for (let j = 0; j < 10; j++) {
          let ball = new Ball(x + 60, y + 60, random(10, 30), color(random(255), random(255), random(255)));
          balls.push(ball);
        }
      } else if (playlists[i].mood === "energetic") {
        // Change the shape of the rectangle
        playlists[i].changeShapeToStar();
      }
    }
  }
}

// Function to draw a star
function drawStar(x, y, radius1, radius2, npoints) {
  let angle = TWO_PI / npoints;
  let halfAngle = angle / 2.0;
  beginShape();
  for (let a = -PI/2; a < TWO_PI-PI/2; a += angle) {
    let sx = x + cos(a) * radius2;
    let sy = y + sin(a) * radius2;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * radius1;
    sy = y + sin(a + halfAngle) * radius1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}