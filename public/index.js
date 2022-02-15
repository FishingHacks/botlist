function autobuttons() {
  //to add an id to buttons with the tag auto_even, following type:  event:function. When you wanna call console.log on onclick, add onclick:console.log. Seperate using ";"
  const buttons = document.getElementsByClassName("auto_even");
  for (i = 0; i < buttons.length; i++) {
    var button = buttons[i];
    var actions = button.id.split(";");
    actions.forEach((action) => {
      try {
        actiontype = action.split(":")[0];
        func = eval(action.split(":")[1]);
        button.addEventListener(actiontype, func);
      } catch (e) {}
    });
  }
}

var switchmodes = () => {
  if (
    document.getElementById("css_mode").href.split("/").at(-1) != "light.css"
  ) {
    document.getElementById("css_mode").href = location.origin + "/light.css";
    document.getElementById("sm").innerText = "Switch to darkmode";
  } else {
    document.getElementById("css_mode").href = location.origin + "/dark.css";
    document.getElementById("sm").innerText = "Switch to lightmode";
  }
};

function load() {
  console.log("executed load");
  autobuttons();
  loadHeader();
  if (typeof window["_load"] == "function") _load();
}

function cmen() {
  document.querySelector(".navbar>ul").classList.remove("toggled");
  document.querySelector(".menc").classList.add("hide");
  document.querySelector(".meno").classList.remove("hide");
}

function omen() {
  document.querySelector(".navbar>ul").classList.add("toggled");
  document.querySelector(".menc").classList.remove("hide");
  document.querySelector(".meno").classList.add("hide");
}