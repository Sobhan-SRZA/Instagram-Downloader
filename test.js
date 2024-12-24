'use strict';
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require('fs');
const Path = require('path')

/**
 * @param {object} mediaData graphql JSON object
 * @returns {string} image or video
 */
function getMediaType(mediaData) {
    if (mediaData.is_video === true) {
        return "video";
    }
    return "image";
}

/**
 * @param {string} oriUrl
 * @returns {string}
 */
function createNewUrl(oriUrl) {
    if (oriUrl.slice(-1) != "/") {
        oriUrl += "/";
    }
    return oriUrl + "?__a=1";
}

/**
 * Download graphql data
 * @param {string} url media url (https://www.instagram.com/p/[mediaCode]/)
 * @returns {object} graphql JSON object
 */
async function downloadMetaData(url) {
    try {
        const metaData = await axios.get(url);
        const $ = cheerio.load(metaData.data);

        return {
            description: $("meta[property='og:description']").attr("content"),
            url: $("meta[property='og:url']").attr("content"),
            thumbnail: $("meta[property='og:image']").attr("content"),
            title: $("meta[property='og:title']").attr("content"),
            is_video: $("video").attr("src") ? true : false
        };
    } catch (error) {
        throw error;
    }
}

/**
 * Download media with axios
 * @param {string} url media url
 * @param {string} filename name of media
 * @param {string} savePath path to save media downloaded
 */
async function download(url, filename, savePath) {
    const path = Path.resolve(savePath, filename)
    const writer = fs.createWriteStream(path)
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    })

    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
    })
}

/**
 * @typedef {Object} DownlodResult
 * @property {string} file - Main file path
 * @property {string} type - The type of media, video or image
 * @property {string} thumbnail - Thumbnail path if video
 */


/**
 * Download media with axios
 * @param {string} url media url
 * @param {string} savePath path to save media downloaded
 * @returns {DownlodResult} 
 */
async function downloadMedia(url, savePath) {
    const newUrl = createNewUrl(url);
    const getMetaData = await downloadMetaData(newUrl);
    const getType = getMediaType(getMetaData);

    const result = {
        file: '',
        type: '',
        thumbnail: ''
    }

    if (getType == "image") {
        await download(getMetaData.url, `${getMetaData.thumbnail}.jpg`, savePath);
        result.file = Path.resolve(savePath, `${getMetaData.shortcode_media.shortcode}.jpg`)
        result.type = 'Image'
    } else {
        await download(getMetaData.url, `${getMetaData.title}.mp4`, savePath);
        await download(getMetaData.thumbnail, `${getMetaData.title}-thumb.jpg`, savePath);

        result.file = Path.resolve(savePath, `${getMetaData.title}.mp4`)
        result.thumbnail = Path.resolve(savePath, `${getMetaData.title}-thumb.jpg`)
        result.type = 'Video'
    }

    return result
}

module.exports = {
    createNewUrl,
    getMediaType,
    downloadMetaData,
    downloadMedia
};