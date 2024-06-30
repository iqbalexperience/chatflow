import express from 'express'
import multer from 'multer'
import path from 'path'
import openaiAssistantsController from '../../controllers/openai-assistants'

const router = express.Router()
// const upload = multer({ dest: `${path.join(__dirname, '..', '..', '..', 'uploads')}/` })

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, `${path.join(__dirname, '..', '..', '..', 'uploads')}/`)
    },
    filename: function (req, file, cb) {
        cb(null, Math.floor(Math.random() * 1000000000) + '_' + file.originalname)
    }
})
var upload = multer({ storage: storage })
// const upload = multer({ dest: `${path.join(__dirname, '..', '..', '..', 'uploads')}/` })

router.get('/', (req, res) => {
    res.send('OpenAI Assistants Files')
})

router.post('/transcription', upload.single('file'), openaiAssistantsController.generateTranscription)

router.post('/download/', openaiAssistantsController.getFileFromAssistant)
router.post('/upload/', upload.array('files'), openaiAssistantsController.uploadAssistantFiles)

export default router
