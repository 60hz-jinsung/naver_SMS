const axios = require("axios");
const Cache = require("memory-cache");
// 암호화 라이브러리
const CryptoJS = require("crypto-js");
require("dotenv").config();

const date = Date.now().toString();
const uri = process.env.SERVICE_ID;
const secretKey = process.env.SECRET_KEY;
const accessKey = process.env.ACCESS_KEY;

const method = "POST";
const space = " ";
const newLine = "\n";
const url = `https://sens.apigw.ntruss.com/sms/v2/services/${uri}/messages`;
const url2 = `/sms/v2/services/${uri}/messages`;

const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, secretKey);

hmac.update(method);
hmac.update(space);
hmac.update(url2);
hmac.update(newLine);
hmac.update(date);
hmac.update(newLine);
hmac.update(accessKey);

const hash = hmac.finalize();
const signature = hash.toString(CryptoJS.enc.Base64);

exports.send = async function (req, res) {
  const phoneNumber = req.body.phoneNumber;

  //인증번호 생성
  const verifyCode = Math.floor(Math.random() * (999999 - 100000)) + 100000;

  Cache.put("phoneNumber", phoneNumber);
  Cache.put("verifyCode", verifyCode.toString());

  console.log("@@@@@@", Cache.get("phoneNumber"));
  console.log("@@@@@@", Cache.get("verifyCode"));

  axios({
    method: method,
    json: true,
    url: url,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "x-ncp-iam-access-key": accessKey,
      "x-ncp-apigw-timestamp": date,
      "x-ncp-apigw-signature-v2": signature,
    },
    data: {
      type: "SMS",
      contentType: "COMM",
      countryCode: "82",
      from: "01096227437", // 발신자 번호
      content: `[식스티헤르츠] 인증번호 [${verifyCode}]를 입력해주세요.`,
      messages: [
        {
          to: `${phoneNumber}`,
        },
      ],
    },
  })
    .then((db) => {
      res.send("성공하였습니다.");
    })
    .catch((err) => {
      if (err.res == undefined) {
        res.send("실패하였습니다.");
      } else res.sned(errResponse(baseResponse.SMS_SEND_FAILURE));
    });
};

const handleDelVerify = () => {
  Cache.del("phoneNumber");
  Cache.del("verifyCode");
};

exports.verify = async function (req, res) {
  const phoneNumber = req.body.phoneNumber;
  const verifyCode = req.body.verifyCode;

  const CachePhoneNum = Cache.get("phoneNumber");
  const CacheCode = Cache.get("verifyCode");

  console.log("서버 결과", CachePhoneNum);
  console.log("서버 결과", CacheCode);
  console.log("이용자 입력란", phoneNumber);
  console.log("이용자 입력란", verifyCode);

  if (!CachePhoneNum) {
    return res.send("휴대폰 번호 인식이 되지 않습니다.");
  } else if (CacheCode !== verifyCode) {
    return res.send("인증번호가 틀립니다.");
  } else {
    handleDelVerify();
    return res.send("인증번호 성립 완료하였습니다.");
  }
};
