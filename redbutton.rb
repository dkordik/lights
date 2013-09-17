#!/usr/bin/env ruby

require 'dream_cheeky'

LIGHTS = "1 2 3 4 5 6"

DreamCheeky::BigRedButton.run do

  def reset
    Process.kill("SIGKILL", $alarm_pid) if $alarm_pid
    Process.kill("SIGKILL", $zombie_pid) if $zombie_pid
    Process.kill("SIGKILL", $chromecast_pid) if $chromecast_pid
  end

  close do
    reset
    `say -v "Zarvox" -r 80 "Disabling alarm sequence"`
    $zombie_pid = spawn({"LIGHTS" => LIGHTS}, ['./onWithSunTemp', './onWithSunTemp'])
    $chromecast_pid = spawn(['./chromecast.js', './chromecast.js'])
  end

  push do
    reset
    $alarm_pid = spawn(['./alarm', './alarm'])
    $zombie_pid = spawn({"LIGHTS" => LIGHTS}, ['./zombies', './zombies'])
    $chromecast_pid = spawn('./chromecast.js', 'YouTube', '5A_CGkVO8cE')
  end

end