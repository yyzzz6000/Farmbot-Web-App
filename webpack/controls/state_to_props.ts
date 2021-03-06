import { Everything } from "../interfaces";
import {
  selectAllPeripherals,
  getFeeds
} from "../resources/selectors";
import { Props } from "./interfaces";
import { maybeFetchUser } from "../resources/selectors";
import * as _ from "lodash";

export function mapStateToProps(props: Everything): Props {
  const peripherals = _.uniq(selectAllPeripherals(props.resources.index));
  const resources = props.resources;

  return {
    feeds: getFeeds(resources.index),
    dispatch: props.dispatch,
    bot: props.bot,
    user: maybeFetchUser(props.resources.index),
    resources,
    peripherals
  };
}
