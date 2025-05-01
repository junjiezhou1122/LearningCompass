const admin = require("firebase-admin");

const serviceAccount = {
  type: "service_account",
  project_id: "learninghowtolearn-a65cd",
  private_key_id: "3b6cc60334fc1c8064a6654cfbe5e75fd779121f",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCbU8mKcFqipvtf\nqeixQ/stYgtP7iMXO9ecGuRyrggcF6ER+uOEgXVgmTQFayo55nvSydK34Efnb1uH\nROOgflc7/croB1qg7Y2s6vVVxBVGIU/3PPbOLKxaDs6xNwOaUTUk3OEDLbaNiu7G\nJgk5HlcsJGA4FVHpNzMplpcsaPv8IJXORtS+v6jnRsFe2KJFVEa/2vglmjACqya3\nFPOm7qkOJIcF0E4jsQ13Ge4Xbnud0OjDJrJ1hIUyOVC92BpUNEt/3qYN7UZ0sGZ6\nL+LNeI2d0yE0hiiTJ4B4SCUnQG6KbTCOhuJIxmGdeu49sOPQN0lBoFQrjEOMmTZk\nh9O8pZBjAgMBAAECggEAJ6J6tAO1bPm0/RUrFkiliFATWOMIOz5+5wuJraWw1hJF\nfIQLmF08aVjOiG9vB/VDNWdgiKEHWAv3TA4NE4AJnHpHU2vE+XmEhFI0Jh1x3EJV\n2F3LEJMfq59JqLjEB5WfPPfLxvbcNUP1Z8R+5/9Q+SeTEdyG2T7HpF4T1zY2zn/P\n/by8YocUdSZLxWcPyPBJuyhIhTQKN5W8Fgq1PjIBfsyjuuObPP9PZfo+kDXIGWLv\nd1BmwdzOkK2SY3FBoooHyX08r9pZEVzInNb3hgFedsxjMYqCCRYz99EDIBQ5s3hw\ncVoKZdPyBCoFGZKte/QUTtrAgUY6idEACYRomHaFWQKBgQDYe7YBa8xOlJo3xc0J\nPyLafhwk4Ie3KjNZUnfbbg56RPOFOpcwPQwECcYoIYb/HXqe+Gv1Qy4mb7K+SqO7\nxvG1KBrzbQHQl6biiVNqEwwNPR0/b77pMFMo6f2wf+MqZSw3qD5noEuEl8vmZI2r\nN8V+HD2ohko8d8SRaYbXc4l0vwKBgQC3rkBFhQRMnliyBCjlF0alKoXGvX5fn5Fj\nMBBFA/9HUA4cg5NHzkP59hjAbWUtfimqvDwL+/QtK0M+zjPJVHylgV82L7b0THvK\nu2VaPA5JioEZYnkmvvdZ5c73AI9nc3YnjAiWF7Bt6ca1X5/AvMsBjXch0yvlENOy\nlOQU7xCZXQKBgQCvT9f/5J1qkZsmSXAW6eM+z9vY3V/qrCkzT76ym7jruYUAQoeH\nUBi3+HZZr3UUinnv3TwIPeRUyiYVRnq8KYs6aoUQ1xkeJIHIeO9tOomK+xABfGw9\niZ3+xydj1N1RSud5Fy2aW8xsT0WXiZzUqHCuBQ7FuCLMPy2XmL7TIcSSHwKBgEI3\ndUAapeQhKYRzb3K3I2ajn7p30bkTQ0xopVTcDgldWNj6rfuy5lqUV3P3fAQceVTt\nqw/+8pXeBM39dDneVVks/HACX4hOkkoRqIYRJG1qmwPVtis7qNwltqjg8NGwlCXJ\nm8bQH3BgWJxGLsdCyER1BT+Saz6XBFpaxqatUGSZAoGAKBJQhGOASyQ7lZE7/x1Y\n5d0sDhHtxOzTFjhkjAT/9/R7Jzd938UKs0U8SQzPi6l+3/EpIk8dv1UiWpKZSLFg\nRrVBOUmdY2E8WyL96gnk8e1DzI1DgxWDv7a3nui7EIp0moCwUFtvb6AHfYEp856N\njENvdPolbG2HuIDjtG3+vb0=\n-----END PRIVATE KEY-----\n",
  client_email:
    "firebase-adminsdk-fbsvc@learninghowtolearn-a65cd.iam.gserviceaccount.com",
  client_id: "104943633054297223347",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40learninghowtolearn-a65cd.iam.gserviceaccount.com",
  universe_domain: "googleapis.com",
};

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = { admin };
