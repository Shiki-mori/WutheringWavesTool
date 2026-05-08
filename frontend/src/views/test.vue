<script setup lang="ts">
import request from '../api/request';

request.get('/hello')
    .then(res => console.log(res.data))
    .catch(err => console.log(err))
</script>

<template>
    <div>
        Test Page
    </div>
</template>