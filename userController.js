const axios = require("axios");
const Cache = require("memory-cache");
// 암호화 라이브러리
const CryptoJS = require("crypto-js");

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

  Cache.del(phoneNumber);

  //인증번호 생성
  const verifyCode = Math.floor(Math.random() * (999999 - 100000)) + 100000;

  Cache.put(phoneNumber, verifyCode.toString());

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
      from: "01012341234",
      content: `[식스티헤르츠] 인증번호 [${verifyCode}]를 입력해주세요.`,
      messages: [
        {
          to: `${phoneNumber}`,
        },
      ],
    },
  })
    .then(function (res) {
      res.send(response(baseResponse.SMS_SEND_SUCCESS));
    })
    .catch((err) => {
      if (err.res == undefined) {
        res.send(response(baseResponse.SMS_SEND_SUCCESS));
      } else res.sned(errResponse(baseResponse.SMS_SEND_FAILURE));
    });
};

exports.verify = async function (req, res) {
  const phoneNumber = req.body.phoneNumber;
  const verifyCode = req.body.verifyCode;

  const CacheData = Cache.get(phoneNumber);

  if (!CacheData) {
    return res.send(errResponse(baseResponse.FAILURE_SMS_AUTHENTICATION));
  } else if (CacheData !== verifyCode) {
    return res.send(errResponse(baseResponse.FAILURE_SMS_AUTHENTICATION));
  } else {
    Cache.del(phoneNumber);
    return res.send(response(baseResponse.SMS_VERIFY_SUCCESS));
  }
};
