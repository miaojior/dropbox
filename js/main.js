const uploadResponse = await fetch(FILES_API_URL, {
    method: 'POST',
    body: formData
});

const responseData = await uploadResponse.json();
if (!uploadResponse.ok) {
    throw new Error(responseData.error || '文件上传失败');
}

content = responseData.url; 