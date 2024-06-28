import { Request, Response, NextFunction } from 'express'
import * as fs from 'fs'
import openaiAssistantsService from '../../services/openai-assistants'
import contentDisposition from 'content-disposition'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { StatusCodes } from 'http-status-codes'
import { streamStorageFile } from 'flowise-components'
import OpenAI from 'openai'
import * as path from 'path';

// List available assistants
const getAllOpenaiAssistants = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.query === 'undefined' || !req.query.credential) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: openaiAssistantsController.getAllOpenaiAssistants - credential not provided!`
            )
        }
        const apiResponse = await openaiAssistantsService.getAllOpenaiAssistants(req.query.credential as string)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

// Get assistant object
const getSingleOpenaiAssistant = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: openaiAssistantsController.getSingleOpenaiAssistant - id not provided!`
            )
        }
        if (typeof req.query === 'undefined' || !req.query.credential) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: openaiAssistantsController.getSingleOpenaiAssistant - credential not provided!`
            )
        }
        const apiResponse = await openaiAssistantsService.getSingleOpenaiAssistant(req.query.credential as string, req.params.id)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

// Download file from assistant
const getFileFromAssistant = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.body.chatflowId || !req.body.chatId || !req.body.fileName) {
            return res.status(500).send(`Invalid file path`)
        }
        const chatflowId = req.body.chatflowId as string
        const chatId = req.body.chatId as string
        const fileName = req.body.fileName as string
        res.setHeader('Content-Disposition', contentDisposition(fileName))
        const fileStream = await streamStorageFile(chatflowId, chatId, fileName)

        if (!fileStream) throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: getFileFromAssistant`)

        if (fileStream instanceof fs.ReadStream && fileStream?.pipe) {
            fileStream.pipe(res)
        } else {
            res.send(fileStream)
        }
    } catch (error) {
        next(error)
    }
}

const uploadAssistantFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.query === 'undefined' || !req.query.credential) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: openaiAssistantsVectorStoreController.uploadFilesToAssistantVectorStore - credential not provided!`
            )
        }
        const files = req.files ?? []
        const uploadFiles: { filePath: string; fileName: string }[] = []

        if (Array.isArray(files)) {
            for (const file of files) {
                uploadFiles.push({
                    filePath: file.path,
                    fileName: file.originalname
                })
            }
        }

        const apiResponse = await openaiAssistantsService.uploadFilesToAssistant(req.query.credential as string, uploadFiles)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const generateTranscription = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const file = req.file
        if (!file) {
            return res.status(400).send('No file uploaded.')
        }
        const openai = new OpenAI({
            apiKey: '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'
        })
        const filePath = path.join(__dirname, file.path)
        const transcriptionObject: any = {
            file: fs.createReadStream(filePath),
            model: 'whisper-1',
            // json, text, srt, verbose_json, or vtt
            response_format: 'text'
        }
        const transcription = await openai.audio.transcriptions.create(transcriptionObject)
        fs.unlinkSync(filePath)
        return res.json({ transcription })
    } catch (error) {
        next(error)
    }
}

export default {
    getAllOpenaiAssistants,
    getSingleOpenaiAssistant,
    getFileFromAssistant,
    uploadAssistantFiles,
    generateTranscription
}
