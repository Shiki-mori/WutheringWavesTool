<template>
  <div>
    <h1>Wuthering Waves Tool</h1>
    <button @click="testBackend">Test Backend</button>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'

const testBackend = async () => {
  try {
    const response = await axios.post('http://localhost:3000/analyze', {
      test:"hello backend"
    })
    console.log(response.data)
  } catch (error) {
    console.error(error)
  }
}
</script>