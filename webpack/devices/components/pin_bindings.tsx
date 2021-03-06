import * as React from "react";
import { t } from "i18next";
import * as _ from "lodash";
import {
  Widget, WidgetBody, WidgetHeader, Row, Col, BlurableInput, DropDownItem
} from "../../ui/index";
import { FBSelect } from "../../ui/new_fb_select";
import { ToolTips } from "../../constants";
import { BotState } from "../interfaces";
import { registerGpioPin, unregisterGpioPin } from "../actions";
import {
  selectAllSequences, findSequenceById
} from "../../resources/selectors";
import { ResourceIndex } from "../../resources/interfaces";
import { MustBeOnline } from "../must_be_online";

export interface PinBindingsProps {
  bot: BotState;
  dispatch: Function;
  resources: ResourceIndex;
}

export interface PinBindingsState {
  isEditing: boolean;
  pinNumberInput: number | undefined;
  sequenceIdInput: number | undefined;
}

enum ColumnWidth {
  pin = 4,
  sequence = 7,
  button = 1
}

export class PinBindings
  extends React.Component<PinBindingsProps, PinBindingsState> {
  constructor(props: PinBindingsProps) {
    super(props);
    this.state = {
      isEditing: false,
      pinNumberInput: undefined,
      sequenceIdInput: undefined
    };
  }

  changeSelection = (input: DropDownItem) => {
    this.setState({ sequenceIdInput: parseInt(input.value as string) });
  }

  sequenceDropDownList = () => {
    const { resources } = this.props;
    const dropDownList: DropDownItem[] = [];
    selectAllSequences(resources)
      .map(sequence => {
        const { id, name } = sequence.body;
        if (_.isNumber(id)) {
          dropDownList.push({ label: name, value: id });
        }
      });
    return dropDownList;
  }

  selectedSequence = () => {
    const { resources } = this.props;
    const { sequenceIdInput } = this.state;
    if (sequenceIdInput) {
      const { id, name } = findSequenceById(resources, sequenceIdInput).body;
      return { label: name, value: (id as number) };
    } else {
      return undefined;
    }
  }

  bindPin = () => {
    const { pinNumberInput, sequenceIdInput } = this.state;
    if (pinNumberInput && sequenceIdInput) {
      this.props.dispatch(registerGpioPin({
        pin_number: pinNumberInput,
        sequence_id: sequenceIdInput
      }));
      this.setState({
        pinNumberInput: undefined,
        sequenceIdInput: undefined
      });
    }
  }

  currentBindingsList = () => {
    const { bot, dispatch, resources } = this.props;
    const { gpio_registry } = bot.hardware;
    return <div style={{ marginBottom: "1rem" }}>
      {gpio_registry &&
        Object.entries(gpio_registry)
          .map(([pin_number, sequence_id]) => {
            return <Row key={`pin_${pin_number}_binding`}>
              <Col xs={ColumnWidth.pin}>
                {`Pi GPIO ${pin_number}`}
              </Col>
              <Col xs={ColumnWidth.sequence}>
                {sequence_id ? findSequenceById(
                  resources, parseInt(sequence_id)).body.name : ""}
              </Col>
              <Col xs={ColumnWidth.button}>
                <button
                  className="fb-button red"
                  onClick={() => {
                    dispatch(unregisterGpioPin(parseInt(pin_number)));
                  }}>
                  <i className="fa fa-minus" />
                </button>
              </Col>
            </Row>;
          })}
    </div>;
  }

  pinBindingInputGroup = () => {
    const { pinNumberInput, sequenceIdInput } = this.state;
    return <Row>
      <Col xs={ColumnWidth.pin}>
        <BlurableInput
          onCommit={(e) => this.setState({
            pinNumberInput: parseInt(e.currentTarget.value)
          })}
          name="pin_number"
          value={pinNumberInput || ""}
          type="number" />
      </Col>
      <Col xs={ColumnWidth.sequence}>
        <FBSelect
          key={sequenceIdInput}
          onChange={this.changeSelection}
          selectedItem={this.selectedSequence()}
          list={this.sequenceDropDownList()} />
      </Col>
      <Col xs={ColumnWidth.button}>
        <button
          className="fb-button green"
          type="button"
          onClick={() => { this.bindPin(); }}
          style={{ marginTop: "0.5rem" }}>
          {t("BIND")}
        </button>
      </Col>
    </Row>;
  }

  render() {
    const syncStatus = this.props.bot.hardware
      .informational_settings.sync_status || "unknown";
    return <Widget className="pin-bindings-widget">
      <WidgetHeader
        title={"Pin Bindings"}
        helpText={ToolTips.PIN_BINDINGS} />
      <WidgetBody>
        <MustBeOnline
          status={syncStatus}
          lockOpen={process.env.NODE_ENV !== "production"}>
          <Row>
            <Col xs={ColumnWidth.pin}>
              <label>
                {t("Pin Number")}
              </label>
            </Col>
            <Col xs={ColumnWidth.sequence}>
              <label>
                {t("Sequence")}
              </label>
            </Col>
          </Row>
          <this.currentBindingsList />
          <this.pinBindingInputGroup />
        </MustBeOnline>
      </WidgetBody>
    </Widget>;
  }
}
