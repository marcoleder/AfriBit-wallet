import React from "react"
import { StyleProp, TouchableWithoutFeedback, View, ViewStyle } from "react-native"
import Icon from "react-native-vector-icons/Ionicons"

import { testProps } from "@app/utils/testProps"
import { Text, makeStyles } from "@rneui/themed"

type ButtonForButtonGroupProps = {
  id: string
  text: string
  icon:
    | string
    | {
        selected: React.ReactElement
        normal: React.ReactElement
      }
  color?: string
}

const ButtonForButtonGroup: React.FC<
  ButtonForButtonGroupProps & {
    selected: boolean
    onPress: () => void
  }
> = ({ text, icon, selected, onPress, color }) => {
  const styles = useStyles({ selected: Boolean(selected) })
  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <View style={styles.button}>
        <Text
          {...testProps(text)}
          style={color === "BTC" ? styles.textBtc : styles.textUsd}
        >
          {text}
        </Text>
        {typeof icon === "string" ? (
          <Icon style={color === "BTC" ? styles.textBtc : styles.textUsd} name={icon} />
        ) : selected ? (
          icon.selected
        ) : (
          icon.normal
        )}
      </View>
    </TouchableWithoutFeedback>
  )
}

export type ButtonGroupProps = {
  selectedId: string
  buttons: ButtonForButtonGroupProps[]
  style?: StyleProp<ViewStyle>
  disabled?: boolean
  onPress: (id: string) => void
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  buttons,
  selectedId,
  onPress,
  style,
  disabled,
}) => {
  const styles = useStyles()
  const selectedButton = buttons.find(({ id }) => id === selectedId)

  return (
    <View style={[styles.buttonGroup, style]}>
      {!disabled &&
        buttons.map((props) => (
          <ButtonForButtonGroup
            key={props.id}
            {...props}
            onPress={() => {
              if (selectedId !== props.id) {
                onPress(props.id)
              }
            }}
            selected={selectedId === props.id}
          />
        ))}
      {disabled && selectedButton && (
        <ButtonForButtonGroup {...selectedButton} selected={true} onPress={() => {}} />
      )}
    </View>
  )
}

const useStyles = makeStyles(({ colors }, { selected }: { selected: boolean }) => ({
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.grey5,
    height: "100%",
  },
  textBtc: {
    fontSize: 16,
    color: selected ? colors.primary : colors.grey1, // change here
  },
  textUsd: {
    fontSize: 16,
    color: selected ? colors._green : colors.grey1, // change here
  },
  buttonGroup: {
    flexDirection: "row",
    columnGap: 10,
    justifyContent: "space-between",
    alignItems: "center",
  },
}))
