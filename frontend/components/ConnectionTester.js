import React, { useState } from 'react';
import { View, Text, Button, ScrollView } from 'react-native';

const ConnectionTester = () => {
  const [results, setResults] = useState([]);

  const addResult = (message) => {
    setResults((prev) => [...prev, message]);
  };

  // Generate a random email each time
  const getRandomEmail = () => {
    const random = Math.floor(Math.random() * 100000);
    return `test${random}@example.com`;
  };

  const testFetch = async () => {
    const randomEmail = getRandomEmail();
    try {
      addResult('Testing with fetch...');
      addResult(`Using email: ${randomEmail}`);
      const response = await fetch('http://localhost:9090/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: randomEmail,
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        }),
      });

      addResult(`Fetch status: ${response.status}`);
      const text = await response.text();
      addResult(`Response: ${text.substring(0, 100)}`);
    } catch (error) {
      addResult(`Fetch error: ${error.message}`);
    }
  };

  const testAxios = async () => {
    const randomEmail = getRandomEmail();
    try {
      const axios = require('axios');
      addResult('Testing with axios...');
      addResult(`Using email: ${randomEmail}`);
      const response = await axios.post('http://localhost:9090/api/auth', {
        email: randomEmail,
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      addResult(`Axios status: ${response.status}`);
      addResult(`Response: ${JSON.stringify(response.data).substring(0, 100)}`);
    } catch (error) {
      addResult(`Axios error: ${error.message}`);
      if (error.response) {
        addResult(`Response status: ${error.response.status}`);
        addResult(`Response data: ${JSON.stringify(error.response.data)}`);
      }
    }
  };

  const testLocalIP = async () => {
    const randomEmail = getRandomEmail();
    try {
      addResult("Testing with your machine's IP...");
      addResult(`Using email: ${randomEmail}`);
      const response = await fetch('http://172.24.59.100:9090/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: randomEmail,
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        }),
      });

      addResult(`IP test status: ${response.status}`);
      const text = await response.text();
      addResult(`Response: ${text.substring(0, 100)}`);
    } catch (error) {
      addResult(`IP test error: ${error.message}`);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Connection Tester
      </Text>
      <View style={{ flexDirection: 'row', marginBottom: 10 }}>
        <Button title="Test Fetch" onPress={testFetch} />
        <Button title="Test Axios" onPress={testAxios} />
        <Button title="Test IP" onPress={testLocalIP} />
        <Button title="Clear" onPress={clearResults} />
      </View>
      <ScrollView
        style={{
          height: 200,
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
        }}
      >
        {results.map((result, index) => (
          <Text key={index} style={{ marginBottom: 5 }}>
            {result}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};

export default ConnectionTester;
