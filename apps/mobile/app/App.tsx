import React, { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';

export default function App() {
  const [step, setStep] = useState(1);

  return (
    <View style={{ padding: 20, gap: 12 }}>
      {step === 1 && (
        <>
          <Text>Enter Phone</Text>
          <TextInput keyboardType="phone-pad" placeholder="9876543210" />
          <Button title="Next" onPress={() => setStep(2)} />
        </>
      )}

      {step === 2 && (
        <>
          <Text>Enter OTP</Text>
          <TextInput keyboardType="number-pad" placeholder="6-digit OTP" />
          <Button title="Verify" onPress={() => setStep(3)} />
        </>
      )}

      {step === 3 && (
        <>
          <Text>Aadhaar Step</Text>
          <Button title="Continue" onPress={() => setStep(4)} />
        </>
      )}

      {step === 4 && (
        <>
          <Text>Profile</Text>
          <TextInput placeholder="Name" />
          <Button title="Submit" onPress={() => setStep(5)} />
        </>
      )}

      {step === 5 && (
        <>
          <Text>Eligible Schemes</Text>
        </>
      )}
    </View>
  );
}
