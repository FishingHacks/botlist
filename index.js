const { escapeXML } = require("ejs");
const botobj = require("./IBot");
const express = require("express");
let config = require("./config/config");
const ejs = require("ejs");
const Enmap = require("enmap");
const app = express();
const api = express();
const { fetch } = require("cross-fetch");
var bodyParser = require("body-parser");
const { type } = require("express/lib/response");
const utils = require("./utils");
const res = require("express/lib/response");
const { bot } = require("./IBot");

function getRandomUUID(length) {
  let alphabet = "a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,tu,v,w,x,y,z".split(
    ","
  );
  alphabet.forEach((element) => {
    alphabet.push(element.toUpperCase());
  });
  "1,2,3,4,5,6,7,8,9,0,!,-,_,*,~".split(",").forEach((element) => {
    alphabet.push(element);
  });
  let UUID = "";
  if (!(typeof length == "number")) throw new Error("No number Provided");
  for (let i = 0; i < length - 1; i++) {
    UUID += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return UUID;
}

function parse(JSON) {
  b = JSON;
  if (typeof JSON == typeof { obj: "obj" }) {
    if (
      b.name &&
      b.description &&
      b.website &&
      b.invite &&
      b.headline &&
      b.tags &&
      b.prefix &&
      b.discordServer &&
      b.avatar
    ) {
      if (
        typeof b.description == "string" &&
        typeof b.website == "string" &&
        typeof b.invite == "string" &&
        typeof b.headline == "string" &&
        typeof b.prefix == "string" &&
        typeof b.discordServer == "string" &&
        typeof b.name == "string" &&
        typeof b.tags == "object" &&
        typeof b.avatar == "string"
      ) {
        try {
          if (b.tags.length <= 0) return true;
          b.tags.forEach((element) => {
            if (typeof element != "string") return false;
          });
        } catch {
          return false;
        }
        return true;
      }
    }
  }
  return false;
}

const db = new Enmap({
  name: "settings",
  autoFetch: true,
  fetchAll: true,
});
if (!db.has("tokens")) {
  db.ensure("tokens", {});
}
if (!db.has("user")) {
  db.ensure("user", {});
}
if (!db.has("bots")) {
  db.ensure("bots", {});
}
if (!db.has("vurls")) {
  db.ensure("vurls", {});
}
if (!db.has("staff")) {
  db.ensure("staff", {});
}
if (!db.has("staff", config.owner)) db.set("staff", "admin", config.owner);
config.mods.forEach((el) => {
  if (!db.has("staff", el)) db.set("staff", "admin", el);
});
app.use(bodyParser.json());
app.set("view engine", ejs);
app.use(express.static("public"));
app.use("/api", api);

function getcookies(req) {
  var cookie = req.headers.cookie;
  // user=someone; session=QyhYzXhkTZawIb5qSl3KKyPVN (this is my cookie i get)
  if (!cookie) return null;
  return cookie.split("; ");
}

function getcookie(cookies, cookiename) {
  if (!cookies) return undefined;
  cookie = cookies.find((w) => w.startsWith(cookiename + "="));
  if (!cookie) return undefined;
  return cookie.replace(cookiename + "=", "");
}

app.get("/login", (req, res) => {
  if (
    getcookie(getcookies(req), "token") != undefined &&
    getcookie(getcookies(req), "token") != null
  ) {
    return res.redirect("/");
  }

  res.send(
    "<script>  const fragment = new URLSearchParams(location.hash.slice(1));const [accessToken, tokenType] = [fragment.get('access_token'), fragment.get('token_type')]; if (!accessToken || !tokenType) { location = 'https://discord.com/oauth2/authorize?client_id=890276769368801381&redirect_uri=http://localhost/login&response_type=token&scope=identify'} else {window.location = window.origin + '/login/' + accessToken + '/' + tokenType;}</script>"
  );
});

app.get("/login/:accessToken/:tokenType", (req, res) => {
  let tokenType = req.params.tokenType;
  let accessToken = req.params.accessToken;

  fetch("https://discord.com/api/users/@me", {
    headers: {
      authorization: `${tokenType} ${accessToken}`,
    },
  })
    .then((result) => result.json())
    .then((response) => {
      if (!db.get("user", response.id)) {
        db.set(
          "user",
          {
            name: response.username,
            id: response.id,
            avatar: response.avatar,
            discriminator: response.discriminator,
            bots: [],
            bio: "No bio available",
            badges: [],
          },
          response.id
        );
      }
      var id = response.id;
      var uname = response.username;
      let token = getRandomUUID(40);
      while (db.has("tokens", token)) {
        token = getRandomUUID(40);
      }
      // console.log(token);
      db.set("tokens", { id: id, username: uname }, token);
      res.cookie("token", token);
      //res.send("");
      res.redirect("/");
    });
});

app.get("/", (req, res) => {
  cookies = getcookies(req);
  let u = undefined;
  user = db.get("user");
  tokens = db.get("tokens");
  u = user[tokens[getcookie(cookies, "token")]?.id];
  let _bots = db.get("bots");
  let bots = [];
  for(_bot in _bots) {
    let __bot = _bots[_bot];
    __bot.id = _bot;
    bots.push(__bot);
  }
  bots.sort((el1, el2) => el2.votes-el1.votes);
  res.render("index.ejs", { u, bots });
});

app.get("/logout", (req, res) => {
  db.delete(getcookie(getcookies(req), "token"));
  res.clearCookie("token");
  res.redirect("/");
});

app.get("/bot/:id/edit", (req, res) => {
  cookies = getcookies(req);
  let u = undefined;
  user = db.get("user");
  tokens = db.get("tokens");
  u = user[tokens[getcookie(cookies, "token")]?.id];
  let bot = db.get("bots", req.params.id);
  if(!bot) return res.redirect("/");
  if(bot.ownerID != u?.id) return res.redirect("/bot/"+req.params.id);
  res.render("bot.edit.ejs", {u, bot})
});

app.get("/bot/:id/delete", (req, res) => {
  cookies = getcookies(req);
  let u = undefined;
  user = db.get("user");
  tokens = db.get("tokens");
  u = user[tokens[getcookie(cookies, "token")]?.id];
  let bot = db.get("bots", req.params.id);
  if(!bot) return res.redirect("/");
  if(bot.ownerID != u?.id) return res.redirect("/bot/"+req.params.id);
  db.delete("bots", req.params.id);
  res.redirect("/");
});

app.get("/bot/:id/edit_submit", (req, res) => {
  cookies = getcookies(req);
  let u = undefined;
  user = db.get("user");
  tokens = db.get("tokens");
  u = user[tokens[getcookie(cookies, "token")]?.id];
  let bot = db.get("bots", req.params.id);
  if(!bot) return res.redirect("/");
  if(bot.ownerID != u.id) return res.redirect("/bot/"+req.params.id);
  params = req.query;
  console.log(req.query)
  let _bot = botobj.fromJSON(bot);
  let {name, headline, description, website, invite, discordServer, prefix, avatar, tags} = req.query;
  if(name && headline && description && website && invite && discordServer && prefix && avatar && tags/* && discordServer.startsWith("https://discord.gg/")*/) {
    headline=headline.replaceAll("\n", "<br />").replaceAll("\r", "");
    description=description.replaceAll("\n", "<br />").replaceAll("\r", "");
    _bot.name=name;
    _bot.headline=headline;
    _bot.description=description;
    _bot.website=website;
    _bot.invite=invite;
    _bot.discordServer=discordServer;
    _bot.prefix=prefix;
    _bot.avatar=avatar;
    _bot.tags=tags.split(",");
  }
  db.set("bots", _bot.toJSON(), req.params.id);
  res.redirect("/bot/"+req.params.id);
});

app.get("/bot/:id", (req, res) => {
  cookies = getcookies(req);
  let u = undefined;
  user = db.get("user");
  tokens = db.get("tokens");
  u = user[tokens[getcookie(cookies, "token")]?.id];
  if (db.has("vurls", req.params.id)) {
    try {
      let bot = botobj.fromJSON(db.get("bots", db.get("vurls", req.params.id)));
      if (!bot) {
        db.delete("bots", db.get("vurls", req.params.id));
        db.delete("vurls", req.params.id);
        return res.redirect("/");
      }
      let owner = db.get("user", bot.ownerID);
      if (!bot.isReviewed && !db.has("staff", u.id)) return res.redirect("/");
      return res.render("bot.ejs", { u: u, bot: bot, owner: owner });
    } catch {
      return res.redirect("/");
    }
  }
  if (db.has("bots", req.params.id)) {
    let bot = botobj.fromJSON(db.get("bots", req.params.id));
    if (!bot) {
      db.delete("bots", req.params.id);
      return res.redirect("/");
    }
    let owner = db.get("user", bot.ownerID);
    // console.log(bot);
    if (!bot.isReviewed && !db.has("staff", u.id)) return res.redirect("/");
    return res.render("bot.ejs", { u: u, bot: bot, owner: owner });
  }
  res.redirect("/");
});

app.get("/user/edit", (req, res) => {
  cookies = getcookies(req);
  let u = undefined;
  user = db.get("user");
  tokens = db.get("tokens");
  u = user[tokens[getcookie(cookies, "token")]?.id];
  if(!u) return res.redirect("/");
  res.render("user.edit.ejs", {u});
})

app.get("/user/edit_submit", (req, res) => {
  cookies = getcookies(req);
  let u = undefined;
  user = db.get("user");
  tokens = db.get("tokens");
  u = user[tokens[getcookie(cookies, "token")]?.id];
  if(!u) return res.redirect("/");
  let {bio} = req.query;
  if(!bio) return res.redirect("/user/"+u.id);
  bio=bio.replaceAll("\n", "<br />").replaceAll('"', '\\\"');
  // console.log(bio)
  u.bio=bio;
  db.set("user", u, u.id);
  return res.redirect("/user/"+u.id);
})

app.get("/user/:id", (req, res) => {
  if (!db.has("user", req.params.id))
    return res.status(404).json({ error: "User not found" });
  let user = db.get("user", req.params.id);
  user.bots = utils.removeDuplicates(user.bots);
  db.set("user", user, req.params.id);
  cookies = getcookies(req);
  //let u = undefined;
  users = db.get("user");
  tokens = db.get("tokens");
  u = users[tokens[getcookie(cookies, "token")]?.id];
  let bots = [];
  user.bots.forEach((el) => {
    bots.push(db.get("bots", el));
  });
  //res.json(user);
  res.render("user.ejs", { u: u, user: user, bots: bots });
});

app.put("/bots/add/:id", (req, res) => {
  if(!req.query.token) return res.status(403).json({ error: "Not logged in" });
  // console.log(req.body);
  if (!db.has("tokens", req.query.token)) {
    return res.status(403).json({ error: "Not logged in" });
  }
  if (db.has("bots", req.params.id)) {
    return res.status(423).json({ error: "Bot already Existent" });
  }
  let ownerID = db.get("tokens", req.query.token).id;
  let u = db.get("user", db.get("tokens", req.query.token).id);
  u.bots.push(req.params.id);
  db.set("user", u, db.get("tokens", req.query.token).id);
  const b = req.body;
  if (!parse(b)) {
    return res.status(400).json({ error: "Bad request; Body isn't complete" });
  } else {
    let bot = new botobj.bot(
      b.name,
      b.description.replaceAll("\n", "<br />").replaceAll("\r", ""),
      req.params.id,
      b.website,
      0,
      b.invite,
      ownerID,
      b.headline.replaceAll("\n", "<br />").replaceAll("\r", ""),
      b.tags,
      b.prefix,
      b.discordServer,
      b.avatar
    );
    db.set("bots", bot.toJSON(), req.params.id);
    // console.log(bot.toJSON());
    return res.status(200).json({ success: "Bot successfuly created" });
  }
});

app.get("/search", (req, res) => {
  if (req.query.q) {
    users = db.get("user");
    cookies = getcookies(req);
    tokens = db.get("tokens");
    u = users[tokens[getcookie(cookies, "token")]?.id];
    let bots = db.get("bots");
    let _bots = [];
    for (_bot in bots) {
      if (bots[_bot].name.includes(req.query.q))
        _bots.push(botobj.fromJSON(bots[_bot]));
      else {
        let add = false;
        bots[_bot].tags.forEach((tag) => {
          if (tag.includes(req.query.q)) add = true;
        });
        if (add) _bots.push(botobj.fromJSON(bots[_bot]));
      }
    }
    res.render("search.ejs", { bots: _bots, u, q: req.query.q });
  } else {
    res.redirect("back");
  }
});

app.get("/bot/:id/vote", (req, res) => {
  if (!db.has("bots", req.params.id)) return res.send("");
  let bot = botobj.fromJSON(db.get("bots", req.params.id));
  if (bot.isReviewed) bot.votes++;
  db.set("bots", bot, req.params.id);
});

function addBadge(id, badgeURL, badgename) {
  if (!db.has("user", id)) return false;
  let u = db.get("user", id);
  u.badges.push({ src: badgeURL, name: badgename });
  db.set("user", u, id);
  return true;
}

app.get("/webinterface", (req, res) => {
  cookies = getcookies(req);
  let u = undefined;
  users = db.get("user");
  tokens = db.get("tokens");
  u = users[tokens[getcookie(cookies, "token")]?.id];
  if (!u) return res.redirect("/");
  let r = "user";
  if (!db.has("staff", tokens[getcookie(cookies, "token")].id)) {
    r = "user";
  } else {
    r = db.get("staff", tokens[getcookie(cookies, "token")].id);
  }
  res.render("webi.ejs", { u: u, role: r });
});

app.delete("/api/bot/:id", (req, res) => {
  cookies = getcookies(req);
  if (
    getcookie(cookies, "token") &&
    db.has("tokens", getcookie(cookies, "token")) &&
    db.has("bots", req.params.id) &&
    db.get("bots", req.params.id).ownerID ==
      db.get("tokens", getcookie(cookies, "token")).id
  ) {
    db.delete("bots", req.params.id);
  }
});

app.get("/api/review/:id", (req, res) => {
  users = db.get("user");
  cookies = getcookies(req);
  tokens = db.get("tokens");
  u = tokens[getcookie(cookies, "token")]?.id;
  if (u && db.has("staff", u)) {
    if (db.has("bots", req.params.id)) {
      review(req.params.id);
      res.status(200).json({ success: true, msg: "", status: 200 });
    }
    res.status(404).json({ success: false, msg: "Bot not found", status: 404 });
  } else {
    res.status(403).json({ success: false, msg: "Forbidden", status: 403 });
  }
});

app.get("/api/exec/:cmd", async (req, res) => {
  cookies = getcookies(req);
  if (
    getcookie(cookies, "token") &&
    config.mods.lastIndexOf(db.get("tokens", getcookie(cookies, "token"))?.id) >
      -1
  ) {
    try {
      out = await eval(req.params.cmd);
      res.json({ success: true, res: JSON.stringify(out) });
    } catch {
      res.json({ success: false, res: "" });
    }
  } else {
    return res.status(403).json({ error: "forbidden" });
  }
});

app.listen(config.PORT, () => {
  console.log("Botlist is listening on http://localhost:" + config.PORT);
});

//-------------------------------------

//webinterface admin eval functions

function getUsers() {
  return db.get("user");
}

function getUser(id) {
  return db.get("user", id);
}

function setVURL(url, bot) {
  db.set("vurls", bot, url);
}

function getBots() {
  return db.get("bots");
}

function getBot(id) {
  return db.get("bots", id);
}

function getVURLs() {
  return db.get("vurls");
}

function setStaff(id) {
  db.set("staff", "admin", id);
}

function review(id) {
  let bot = db.get("bots", id);
  bot = botobj.fromJSON(bot);
  if (!bot) return;
  bot.review();
  db.set("bots", bot.toJSON(), id);
}

// ---------------------------------------

app.get("/api/bot/:id", (req, res) => {
  if(!db.get("bots", req.params.id)) return res.status(404).json({error: "Bot not found", code: 404});
  const vurls = getVURLs();
  let _v = "";
  for(v in vurls) {
    if(vurls[v]==req.params.id) (_v = v);
  }
  res.status(200).json({code: 200, body: db.get("bots", req.params.id), vanity: _v})
});

app.get("/api/user/:id", (req, res) => {
  if(!db.get("user", req.params.id)) return res.status(404).json({error: "User not found", code: 404});
  let user = db.get("user", req.params.id);
  let bots = user.bots;
  let nb = [];
  bots.forEach(el=>{
    if(getBot(el)) nb.push(el);
  })
  user.bots=nb;
  db.set("user", user, req.params.id);
  res.status(200).json({code: 200, body: db.get("user", req.params.id)});
})

app.use((req, res) => {
  res.render("e404.ejs", {botname: "Botlist"});
})