import "./css/_index.scss";
import * as React from "react";
import { Provider } from "react-redux";
import * as _ from "lodash";
import { Router, RedirectFunction, RouterState } from "react-router";
import { App } from "./app";
import { store as _store } from "./redux/store";
import { history } from "./history";
import { Store } from "./redux/interfaces";
import { ready } from "./config/actions";
import { Session } from "./session";
import { attachToRoot } from "./util";
import { Callback } from "i18next";

const key = "Dec 8 13:16";

if (!localStorage[key]) {
  localStorage[key] = JSON.stringify("X");
  location.reload(true);
}

interface RootComponentProps {
  store: Store;
}

function errorLoading(err: object) {
  console.error("Dynamic page loading failed", err);
  const container = document.getElementById("root");
  const stack = _.get(err, "stack", "No stack.");
  const message = _.get(err, "message", "No message available.");

  Rollbar && Rollbar.error && Rollbar.error(message);

  let msg: string;
  try {
    msg = JSON.stringify({ message, stack });
  } catch (error) {
    msg = "Failed to extract error.";
  }
  if (container) {
    container.innerHTML = (`
    <div>
      <h1> Something went wrong! </h1>
      <p>We hit an internal error while rendering this page.</p>
      <p>We have been notified of the issue and will investigate a solution shortly.</p>
      <hr/>
      <p>In the mean time, you can try the following:</P>
      <ul>
        <li> Refresh the page and log in again.</li>
        <li> Send the error information (below) to our developer team via the
        <a href="http://forum.farmbot.org/c/software">FarmBot software
        forum</a>. Including additional information (such as steps leading up
        to the error) help us identify solutions more quickly. </li>
      <hr/>
      <pre>
      <br/>
      ${msg}
    </pre>
    </div>
  `);
  }
  sessionStorage.clear();
  if (!location.hostname.includes("localhost")) {
    // Clear cache for end users, but not developers.
    localStorage.clear();
  }
  const y = document.querySelectorAll("link");
  for (let x = 0; x < y.length; x++) {
    const element = y[x];
    element.remove();
  }
}

// errorLoading(() => { })({});
const controlsRoute = {
  path: "app/controls",
  getComponent(_discard: void, cb: Function) {
    import("./controls/controls")
      .then((module) => cb(undefined, module.Controls))
      .catch(errorLoading);
  }
};

export const attachAppToDom: Callback = (err, t) => {
  attachToRoot(RootComponent, { store: _store });
  _store.dispatch(ready());
};

export class RootComponent extends React.Component<RootComponentProps, {}> {

  requireAuth(_discard: RouterState, replace: RedirectFunction) {
    const { store } = this.props;
    if (Session.fetchStoredToken()) { // has a previous session in cache
      if (store.getState().auth) { // Has session, logged in.
        return;
      } else { // Has session but not logged in (returning visitor).
        store.dispatch(ready());
      }
    } else { // Not logged in yet.
      Session.clear();
    }
  }

  /** These methods are a way to determine how to load certain modules
   * based on the device (mobile or desktop) for optimization/css purposes.
   * Open to revision.
   */
  maybeReplaceDesignerModules(next: RouterState, replace: RedirectFunction) {
    if (next.location.pathname === "/app/designer") {
      replace(`${next.location.pathname}/plants`);
    }
  }
  /*
    /app                => App
    /app/account        => Account
    /app/controls       => Controls
    /app/device         => Devices
    /app/designer?p1&p2 => FarmDesigner
    /app/regimens       => Regimens
    /app/sequences      => Sequences
    /app/tools          => Tools
    /app/404            => 404
  */

  routes = {
    component: App,
    indexRoute: controlsRoute,
    childRoutes: [
      {
        path: "app/account",
        getComponent(_discard: void, cb: Function) {
          import("./account/index")
            .then(module => cb(undefined, module.Account))
            .catch(errorLoading);
        }
      },
      controlsRoute,
      {
        path: "app/device",
        getComponent(_discard: void, cb: Function) {
          import("./devices/devices")
            .then(module => cb(undefined, module.Devices))
            .catch(errorLoading);
        }
      },
      {
        path: "app/farmware",
        getComponent(_discard: void, cb: Function) {
          import("./farmware/index")
            .then(module => cb(undefined, module.FarmwarePage))
            .catch(errorLoading);
        }
      },
      {
        path: "app/designer",
        onEnter: this.maybeReplaceDesignerModules.bind(this),
        getComponent(_discard: void, cb: Function) {
          import("./farm_designer/index")
            .then(module => cb(undefined, module.FarmDesigner))
            .catch(errorLoading);
        },
        childRoutes: [
          {
            path: "plants",
            getComponent(_discard: void, cb: Function) {
              import("./farm_designer/plants/plant_inventory")
                .then(module => cb(undefined, module.Plants))
                .catch(errorLoading);
            },
          },
          {
            path: "plants/crop_search",
            getComponent(_discard: void, cb: Function) {
              import("./farm_designer/plants/crop_catalog")
                .then(module => cb(undefined, module.CropCatalog))
                .catch(errorLoading);
            },
          },
          {
            path: "plants/crop_search/:crop",
            getComponent(_discard: void, cb: Function) {
              import("./farm_designer/plants/crop_info")
                .then(module => cb(undefined, module.CropInfo))
                .catch(errorLoading);
            },
          },
          {
            path: "plants/crop_search/:crop/add",
            getComponent(_discard: void, cb: Function) {
              import("./farm_designer/plants/add_plant")
                .then(module => cb(undefined, module.AddPlant))
                .catch(errorLoading);
            },
          },
          {
            path: "plants/select",
            getComponent(_discard: void, cb: Function) {
              import("./farm_designer/plants/select_plants")
                .then(module => cb(undefined, module.SelectPlants))
                .catch(errorLoading);
            },
          },
          {
            path: "plants/:plant_id",
            getComponent(_discard: void, cb: Function) {
              import("./farm_designer/plants/plant_info")
                .then(module => cb(undefined, module.PlantInfo))
                .catch(errorLoading);
            },
          },
          {
            path: "plants/:plant_id/edit",
            getComponent(_discard: void, cb: Function) {
              import("./farm_designer/plants/edit_plant_info")
                .then(module => cb(undefined, module.EditPlantInfo))
                .catch(errorLoading);
            },
          },
          {
            path: "farm_events",
            getComponent(_discard: void, cb: Function) {
              import("./farm_designer/farm_events/farm_events")
                .then(module => cb(undefined, module.FarmEvents))
                .catch(errorLoading);
            }
          },
          {
            path: "farm_events/add",
            getComponent(_discard: void, cb: Function) {
              import("./farm_designer/farm_events/add_farm_event")
                .then(module => cb(undefined, module.AddFarmEvent))
                .catch(errorLoading);
            }
          },
          {
            path: "farm_events/:farm_event_id",
            getComponent(_discard: void, cb: Function) {
              import("./farm_designer/farm_events/edit_farm_event")
                .then(module => cb(undefined, module.EditFarmEvent))
                .catch(errorLoading);
            }
          }
        ]
      },
      {
        path: "app/regimens",
        getComponent(_discard: void, cb: Function) {
          import("./regimens/index")
            .then(module => cb(undefined, module.Regimens))
            .catch(errorLoading);
        },
      },
      {
        path: "app/regimens/:regimen",
        getComponent(_discard: void, cb: Function) {
          import("./regimens/index")
            .then(module => cb(undefined, module.Regimens))
            .catch(errorLoading);
        }
      },
      {
        path: "app/sequences",
        getComponent(_discard: void, cb: Function) {
          import("./sequences/sequences")
            .then(module => {
              cb(undefined, module.Sequences);
            })
            .catch(errorLoading);
        },
      },
      {
        path: "app/sequences/:sequence",
        getComponent(_discard: void, cb: Function) {
          import("./sequences/sequences")
            .then(module => cb(undefined, module.Sequences))
            .catch(errorLoading);
        },
      },
      {
        path: "app/tools",
        getComponent(_discard: void, cb: Function) {
          import("./tools/index")
            .then(module => cb(undefined, module.Tools))
            .catch(errorLoading);
        }
      },
      {
        path: "app/logs",
        getComponent(_discard: void, cb: Function) {
          import("./logs/index")
            .then(module => cb(undefined, module.Logs))
            .catch(errorLoading);
        }
      },
      {
        path: "*",
        getComponent(_discard: void, cb: Function) {
          import("./404")
            .then(module => cb(undefined, module.FourOhFour))
            .catch(errorLoading);
        }
      }
    ]
  };

  render() {
    // ==== TEMPORARY HACK. TODO: Add a before hook, if such a thing exists in
    // React Router. Or switch routing libs.
    const notLoggedIn = !Session.fetchStoredToken();
    const restrictedArea = window.location.pathname.includes("/app");
    if (notLoggedIn && restrictedArea) {
      Session.clear();
    }
    // ==== END HACK ====
    return <Provider store={_store}>
      <Router history={history}>
        {this.routes}
      </Router>
    </Provider>;
  }
}
