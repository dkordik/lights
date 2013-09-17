#!/usr/bin/env ruby

require 'dream_cheeky'

DreamCheeky::BigRedButton.run do
  lights = "1 2 3 4 5 6"
  close do
    Process.kill("SIGKILL", $alarm_pid) if $alarm_pid
    Process.kill("SIGKILL", $zombie_pid) if $zombie_pid
    `say -v "Zarvox" -r 80 "Disabling alarm sequence"`
    $zombie_pid = spawn({"LIGHTS" => lights}, ['./onWithSunTemp', './onWithSunTemp'])
  end

  push do
    Process.kill("SIGKILL", $alarm_pid) if $alarm_pid
    Process.kill("SIGKILL", $zombie_pid) if $zombie_pid
    $alarm_pid = spawn(['./alarm', './alarm'])
    $zombie_pid = spawn({"LIGHTS" => lights}, ['./zombies', './zombies'])
  end
end