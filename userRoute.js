const user = require("./userController.js");
const express = require("express");

const app = express();

var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.listen(3000, () => {
  //포트번호 3000으로 서버 구동
  console.log("서버 시작 주소: http:localhost:3000");
});

// app.get("/app/read", "hello");

// 문자인증(SENS를 통한) 전송 API
app.post("/app/send", user.send);

// // 문자인증(SENS를 통한) 검증 API
app.post("/app/verify", user.verify);
