import * as path from "path"
import * as fs from "fs-extra"
import * as os from "os"

import { runTests } from "@vscode/test-electron"

async function main() {
    try {
        // The folder containing the Extension Manifest package.json
        // Passed to `--extensionDevelopmentPath`
        const extensionDevelopmentPath = path.resolve(__dirname, "../../")

        // The path to test runner
        // Passed to --extensionTestsPath
        const extensionTestsPath = path.resolve(__dirname, "./suite/index")

        const userDataDir = path.resolve(os.tmpdir(), "type-explorer-user")

        if (await fs.pathExists(userDataDir)) {
            await fs.remove(userDataDir)
        }

        console.log("user data dir", userDataDir)

        // Download VS Code, unzip it and run the integration test
        await runTests({
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs: [`--user-data-dir=${userDataDir}`],
        })
    } catch (err) {
        console.error("Failed to run tests")
        process.exit(1)
    }
}

main()
