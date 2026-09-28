local FADE_MS = 900

AddEventHandler('playerSpawned', function()
    SendLoadingScreenMessage(json.encode({ eventName = 'BLFadeOut' }))
    Wait(FADE_MS)
    ShutdownLoadingScreenNui()
end)
CreateThread(function()
    while true do
        Wait(1000)
        if NetworkIsSessionStarted() and not IsPlayerSwitchInProgress() then
            Wait(15000)
            ShutdownLoadingScreenNui()
            return
        end
    end
end)
