import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';

const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  disabled = false,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  inputStyle,
  multiline = false,
  numberOfLines = 1,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!secureTextEntry);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getContainerStyle = () => {
    const baseStyle = [styles.container];
    
    if (isFocused) {
      baseStyle.push(styles.containerFocused);
    }
    
    if (error) {
      baseStyle.push(styles.containerError);
    }
    
    if (disabled) {
      baseStyle.push(styles.containerDisabled);
    }
    
    return baseStyle;
  };

  return (
    <View style={[styles.wrapper, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={getContainerStyle()}>
        {leftIcon && (
          <Ionicons 
            name={leftIcon} 
            size={20} 
            color={isFocused ? colors.primary : colors.textSecondary}
            style={styles.leftIcon}
          />
        )}
        
        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            (rightIcon || secureTextEntry) && styles.inputWithRightIcon,
            inputStyle
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          value={value}
          onChangeText={onChangeText}
          editable={!disabled}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {secureTextEntry && (
          <TouchableOpacity 
            onPress={togglePasswordVisibility}
            style={styles.rightIcon}
          >
            <Ionicons 
              name={showPassword ? 'eye-off' : 'eye'} 
              size={20} 
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
        
        {rightIcon && !secureTextEntry && (
          <TouchableOpacity 
            onPress={onRightIconPress}
            style={styles.rightIcon}
          >
            <Ionicons 
              name={rightIcon} 
              size={20} 
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.transparent,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  containerFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.backgroundCard,
  },
  containerError: {
    borderColor: colors.error,
  },
  containerDisabled: {
    backgroundColor: colors.borderLight,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    padding: 0, // Remove default padding
  },
  inputWithLeftIcon: {
    marginLeft: 12,
  },
  inputWithRightIcon: {
    marginRight: 12,
  },
  leftIcon: {
    marginRight: 0,
  },
  rightIcon: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default Input;