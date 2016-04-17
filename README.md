# BT Client

This is a tunneling client developed using bt tunneling API.

For bt API please visit (https://github.com/smaldeniya/bt)

## Getting Started




## Configurations

Edit the [bt-tunnle.json] to reflect your tunnel environment settings.

```
{
  "privateKey": "./ssl/server.key",
  "certificate": "./ssl/server.crt",
  "tunnle": {
    "dstHost": "www.example.com",
    "username" : "testUser",
    "srcHost" : "localhost"
  },
  "serverPort" : 3200
}
```
* privateKey - bt tunneling server private key for wss connectivity
* certificate - bt tunneling server certificate for wss connectivity
* dstHost - destination host/your tunnelling server
* username - your user name
* srcHost - source host (default localhost)
* serverPort - port that the bt tunneling server should use

## Built With

* node.js
* bt - tunneling API

## Authors

* **Sahan Maldeniya** - *Initial work* - [smaldeniya](https://github.com/smaldeniya)

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details


