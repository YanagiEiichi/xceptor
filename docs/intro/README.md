## XCeptor

An interceptor of [XHR](https://xhr.spec.whatwg.org/).

## Install

```bash
npm install xceptor
```

## Usage

```javascript
XCeptor.when(method, route, requestHandler, responseHandler);
```

| name            | type             | meaning               |
| --------------- | ---------------- | --------------------- |
| method          | RegExp or String | HTTP Method Matcher   |
| route           | RegExp or String | Request Path Matcher  |
| requestHandler  | Function         | Request Hook Handler  |
| responseHandler | Function         | Response Hook Handler |

In addition, some shortcut methods are provided:

```javascript
XCeptor.get(...args);
XCeptor.post(...args);
XCeptor.put(...args);
XCeptor.delete(...args);
XCeptor.patch(...args);
```

## Schematic Diagram

<img src="XCeptor.png" width="538" height="458" />

## Demo

### 1. Mock a resource

```html
<script src="/node_modules/xceptor/xceptor.js"></script>
<script>
XCeptor.get(new RegExp('^/hello$'), (req, res) => {
  res.responseText = 'Hello XCeptor';
  return false;
});

var xhr = new XMLHttpRequest();
xhr.open('GET', '/hello');
xhr.onload = () => {
  alert(xhr.responseText);
};
xhr.send();
</script>
```

### 2. Go to login on 401

```html
<script src="/node_modules/xceptor/xceptor.js"></script>
<script>
XCeptor.when(/^/, new RegExp('^/login$'), null, (req, res) => { 
  if(res.status !== 401) return;
  location.href = '/login';
});
</script>
```
