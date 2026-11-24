import { useState, type ComponentRef, type Ref } from 'react';
import { Pressable, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { AppText } from '../AppText';
import { Icon } from '../Icon';
import { colors } from '../theme';
import { styles } from './styles';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  /** Shown under the field in the error colour; also marks the field invalid. */
  error?: string;
  /** Shown under the field when there is no error. */
  hint?: string;
  /** Adds a show/hide button for passwords. */
  password?: boolean;
  style?: StyleProp<ViewStyle>;
  ref?: Ref<ComponentRef<typeof TextInput>>;
};

/** A labelled text input with an error line, and an optional show/hide toggle for passwords. */
export function TextField({ label, error, hint, password, style, testID, ref, ...input }: TextFieldProps) {
  const [hidden, setHidden] = useState(true);
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.wrap, style]}>
      <AppText variant="labelAction">{label}</AppText>
      <View style={[styles.box, focused && styles.boxFocused, !!error && styles.boxError]}>
        <TextInput
          ref={ref}
          {...input}
          testID={testID}
          accessibilityLabel={label}
          secureTextEntry={password ? hidden : input.secureTextEntry}
          placeholderTextColor={colors.textSubtle}
          onFocus={(e) => {
            setFocused(true);
            input.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            input.onBlur?.(e);
          }}
          style={styles.input}
        />
        {password ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            onPress={() => setHidden((h) => !h)}
            hitSlop={8}
            style={styles.toggle}>
            <Icon name={hidden ? 'visibility' : 'visibility-off'} size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText variant="bodySm" color={colors.error} accessibilityRole="alert">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="bodySm" color={colors.textMuted}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}
