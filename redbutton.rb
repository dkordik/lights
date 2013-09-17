#!/usr/bin/env ruby

require 'dream_cheeky'

root=File.dirname(__FILE__)

LIGHTS = "1 2 3 4 5 6"

DreamCheeky::BigRedButton.run do

  p "Started Big Red Button."

  def reset
    Process.kill("SIGKILL", $alarm_pid) if $alarm_pid
    Process.kill("SIGKILL", $zombie_pid) if $zombie_pid
    Process.kill("SIGKILL", $chromecast_pid) if $chromecast_pid
  end

  close do
    reset
    $alarm_pid = spawn('ssh', 'dkordik@192.168.2.4', "say -v 'Zarvox' -r 80 'Disabling alarm sequence'")
    $zombie_pid = spawn({"LIGHTS" => LIGHTS}, ['#{root}/onWithSunTemp', '#{root}/onWithSunTemp'])
    $chromecast_pid = spawn(['#{root}/chromecast.js', '#{root}/chromecast.js'])
  end

  push do
    reset
    $chromecast_pid = spawn('#{root}/chromecast.js', 'YouTube', '5A_CGkVO8cE')
    $zombie_pid = spawn({"LIGHTS" => LIGHTS}, ['#{root}/zombies', '#{root}/zombies'])
    $alarm_pid = spawn('ssh', 'dkordik@192.168.2.4', "afplay '/Users/dkordik/Documents/code/lights/alarm.mp3'")
  end

end