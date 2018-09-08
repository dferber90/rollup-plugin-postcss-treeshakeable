# Treeshaking example

This example shows how a library using this plugin can benefit from treeshaking.

The example sets up a ui-library and an application. Imagine that the ui-library
is a separate npm module, which application uses to build its UI.

We would want to only include the styles and source code of components of ui-library used by
application. This walkthrough shows how that happens.

The application uses our library, which is built with this plugin.

## Preparing the example ui-library

### Install the dependencies

```
# in example/ui-library
npm install
```

### Build `ui-library`

```
# in example/ui-library
npm run build
```

Now check out the contents of `example/ui-library/dist/index.esm.js`.
You can see that there are two components included:

```js
var cssMap = { "alfred": "Butler-mod_alfred__3zrhW" };
var hasRun;
var styles = function styles() {
  if (!hasRun) {
    hasRun = true;
    styleInject(".Butler-mod_alfred__3zrhW {\n  background: red;\n}\n");
  }
  return cssMap;
};

var Butler = function Butler(props) {
  return React.createElement("div", {
    className: styles().alfred
  }, "I am Butler");
};
```

and

```js
var cssMap$1 = { "container": "ButlerContainer-mod_container__o_jrX" };
var hasRun$1;
var styles$1 = function styles() {
  if (!hasRun$1) {
    hasRun$1 = true;
    styleInject(".ButlerContainer-mod_container__o_jrX {\n  background-color: green;\n}\n");
  }
  return cssMap$1;
};

var ButlerContainer = function ButlerContainer(props) {
  return React.createElement("div", {
    className: styles$1().container
  }, "I am ButlerContainer");
};
```

Both are exported at the end: `export { Butler, ButlerContainer };`.

If a consumer only uses `ButlerContainer`, then the consumer doesn't need to include the code of `Butler` and vice versa.

### Link `ui-library`

Now that we generated our first build, we can link the `ui-library` to the `application` so that we can test it out.

Run `npm link` in `example/ui-library`.

## Preparing the example application

### Install the dependencies


Let's first link the ui-library we've just built:

```
# in example/application
yarn link ui-library
```

We can now install the dependencies

```
# in example/application
npm install
```

### Take a look at `example/application/src/App.js`

The contents are

```js
import React, { Component } from "react";
import { ButlerContainer } from "ui-library";

class App extends Component {
  render() {
    return (
      <div className="App">
        <ButlerContainer />
      </div>
    );
  }
}

export default App;
```

Notice that we are not importing Butler itself, so we will treeshake it out when
building. So let's do that now.

### Build

Run `yarn build` from `examples/application`.

### Verify treeshaking

To verify that our CSS has been removed by treeshaking, we need to inspect
the file produced by the build.

Open `example/application/build/static/js/main.*.js`.

This file is uglified so it's hard to understand.

First, we can verify that only the `ButlerContainer` component is part of the final build, as that's the only component used by our application. The `Butler` component is not used by the application and is thus excluded.

Search the file for `I am ButlerContainer` and you'll have a match. But you won't be able to find `I am Butler` which our `Butler` component would render. This means that treeshaking has removed the compontent itself!

Everything so far would have worked without `rollup-plugin-postcss-treeshakeable`.

Now, on to the CSS. We can search for `.Butler` in that file to see that there
is only one match: The style of `.ButlerContainer`, but there is no style for `.Butler` itself.
This means that we didn't just get rid of the `Butler` component, but we also got rid of its styles during treeshaking. This would not have worked without `rollup-plugin-postcss-treeshakeable`.


## Additional hints

### Building non-uglified code

You can comment out the `new webpack.optimize.UglifyJsPlugin()` call in `example/application/config/webpack.config.prod.js` and rerun `yarn build` in `example/application`. If you then inspect the generated, bundle you'll see that the code is no longer removed. That's because we rely on `Uglify` to do dead code elimination. `Uglify` removes the code which is marked as unused by Webpack through a `/* unused harmony export Butler */` comment. You'll be able to see this comment instead then!

You'll still be able to notice that Webpack has marked the `Butler` export as unused by searching for the `/* unused harmony export Butler */` comment.

This marking would work without the `rollup-plugin-postcss-treeshakeable` as well. The difference this plugin makes is that the styles will get removed as well when the component is removed.

### Starting in production

If you want to verify that the bundle works, you can install `serve` globally (`yarn global add serve`) and run `serve -s build` from `examples/application`.
